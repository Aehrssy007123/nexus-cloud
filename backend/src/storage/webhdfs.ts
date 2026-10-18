import axios, { AxiosInstance } from 'axios';
import { Readable } from 'stream';

export interface HDFSHealthStatus {
  connected: boolean;
  namenodeUrl: string;
  latencyMs?: number;
  homeDirectory?: string;
  clusterStatus?: string;
  totalCapacityBytes?: number;
  usedCapacityBytes?: number;
  freeCapacityBytes?: number;
  error?: string;
  checkedAt: string;
}

export class WebHDFSService {
  private baseUrl: string;
  private username: string;
  private client: AxiosInstance;
  private datanodeHostOverride?: string;

  constructor() {
    // Default Hadoop 3.x WebHDFS URL: http://localhost:9870/webhdfs/v1
    this.baseUrl = (process.env.HDFS_URL || 'http://localhost:9870/webhdfs/v1').replace(/\/+$/, '');
    this.username = process.env.HDFS_USER || 'hdfs';
    this.datanodeHostOverride = process.env.HDFS_DATANODE_HOST_OVERRIDE; // e.g. 'localhost' if datanode returns internal docker hostname

    this.client = axios.create({
      timeout: 10000,
      maxRedirects: 0, // We manually handle WebHDFS 307 redirects to DataNodes for precise control
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getUsername(): string {
    return this.username;
  }

  /**
   * Health check to real WebHDFS NameNode
   */
  public async checkHealth(): Promise<HDFSHealthStatus> {
    const startTime = Date.now();
    try {
      // Step 1: Test GET /?op=GETHOMEDIRECTORY
      const response = await axios.get(`${this.baseUrl}/?op=GETHOMEDIRECTORY&user.name=${this.username}`, {
        timeout: 4000,
      });

      const latency = Date.now() - startTime;
      const homeDir = response.data?.Path || '/';

      // Step 2: Try querying Hadoop JMX endpoint for storage capacity if available
      let capacity = 0;
      let used = 0;
      let free = 0;

      try {
        const jmxUrl = this.baseUrl.replace(/\/webhdfs\/v1.*$/, '/jmx?qry=Hadoop:service=NameNode,name=FSNamesystemState');
        const jmxRes = await axios.get(jmxUrl, { timeout: 3000 });
        if (jmxRes.data?.beans && jmxRes.data.beans.length > 0) {
          const bean = jmxRes.data.beans[0];
          capacity = bean.CapacityTotal || 0;
          used = bean.CapacityUsed || 0;
          free = bean.CapacityRemaining || 0;
        }
      } catch {
        // JMX is optional; ignore if unavailable
      }

      return {
        connected: true,
        namenodeUrl: this.baseUrl,
        latencyMs: latency,
        homeDirectory: homeDir,
        clusterStatus: 'Active & Accessible',
        totalCapacityBytes: capacity,
        usedCapacityBytes: used,
        freeCapacityBytes: free,
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        namenodeUrl: this.baseUrl,
        error: err.code === 'ECONNREFUSED'
          ? `HDFS Connection Refused: Unable to connect to WebHDFS NameNode at ${this.baseUrl}. Ensure Hadoop is running and WebHDFS is enabled.`
          : (err.message || 'HDFS NameNode unreachable'),
        clusterStatus: 'Disconnected',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Adjusts redirect URL if DataNode hostname requires re-routing (e.g. docker host resolution)
   */
  private adjustDataNodeUrl(locationUrl: string): string {
    if (!this.datanodeHostOverride) {
      return locationUrl;
    }
    try {
      const parsed = new URL(locationUrl);
      parsed.hostname = this.datanodeHostOverride;
      return parsed.toString();
    } catch {
      return locationUrl;
    }
  }

  /**
   * Upload file into HDFS using WebHDFS 2-step protocol
   */
  public async uploadFile(hdfsPath: string, fileBuffer: Buffer, mimeType: string = 'application/octet-stream'): Promise<void> {
    const cleanPath = hdfsPath.startsWith('/') ? hdfsPath : `/${hdfsPath}`;
    const initialUrl = `${this.baseUrl}${cleanPath}?op=CREATE&overwrite=true&user.name=${this.username}`;

    let dataNodeUrl: string;

    try {
      // Step 1: Initiate CREATE request to NameNode. Expect HTTP 307 with Location header.
      const initialResponse = await this.client.put(initialUrl, null, {
        headers: { 'Content-Type': mimeType },
      });

      if (initialResponse.status === 307) {
        dataNodeUrl = initialResponse.headers['location'];
      } else {
        throw new Error(`Unexpected response from HDFS NameNode: HTTP ${initialResponse.status}`);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 307) {
        dataNodeUrl = error.response.headers['location'];
      } else {
        throw new Error(
          `HDFS NameNode error initiating upload for ${cleanPath}: ${error.code || error.message}. Ensure Hadoop WebHDFS is running at ${this.baseUrl}.`
        );
      }
    }

    if (!dataNodeUrl) {
      throw new Error('HDFS NameNode did not provide a DataNode redirection Location header.');
    }

    const finalTargetUrl = this.adjustDataNodeUrl(dataNodeUrl);

    // Step 2: Stream buffer to DataNode
    try {
      await axios.put(finalTargetUrl, fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileBuffer.length,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 60000, // 60s timeout for large uploads
      });
    } catch (err: any) {
      throw new Error(`HDFS DataNode upload failed at ${finalTargetUrl}: ${err.message}`);
    }
  }

  /**
   * Download file from HDFS (stream response)
   */
  public async downloadFile(hdfsPath: string): Promise<Readable> {
    const cleanPath = hdfsPath.startsWith('/') ? hdfsPath : `/${hdfsPath}`;
    const initialUrl = `${this.baseUrl}${cleanPath}?op=OPEN&user.name=${this.username}`;

    try {
      // Axios with responseType: 'stream' will follow standard 307 redirects automatically to DataNode
      const response = await axios.get(initialUrl, {
        responseType: 'stream',
        timeout: 30000,
        maxRedirects: 5,
      });

      return response.data as Readable;
    } catch (err: any) {
      throw new Error(`Failed to download file from HDFS (${cleanPath}): ${err.message}`);
    }
  }

  /**
   * Delete file from HDFS
   */
  public async deleteFile(hdfsPath: string): Promise<boolean> {
    const cleanPath = hdfsPath.startsWith('/') ? hdfsPath : `/${hdfsPath}`;
    const deleteUrl = `${this.baseUrl}${cleanPath}?op=DELETE&recursive=true&user.name=${this.username}`;

    try {
      const response = await axios.delete(deleteUrl, { timeout: 10000 });
      return response.data?.boolean === true;
    } catch (err: any) {
      // If file does not exist in HDFS, don't crash delete operation
      if (err.response?.status === 404) {
        return true;
      }
      throw new Error(`Failed to delete file from HDFS (${cleanPath}): ${err.message}`);
    }
  }

  /**
   * Rename file in HDFS
   */
  public async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    const cleanOld = oldPath.startsWith('/') ? oldPath : `/${oldPath}`;
    const cleanNew = newPath.startsWith('/') ? newPath : `/${newPath}`;
    const renameUrl = `${this.baseUrl}${cleanOld}?op=RENAME&destination=${encodeURIComponent(cleanNew)}&user.name=${this.username}`;

    try {
      const response = await axios.put(renameUrl, null, { timeout: 10000 });
      return response.data?.boolean === true;
    } catch (err: any) {
      throw new Error(`Failed to rename in HDFS: ${err.message}`);
    }
  }

  /**
   * Create folder in HDFS
   */
  public async createDirectory(hdfsPath: string): Promise<boolean> {
    const cleanPath = hdfsPath.startsWith('/') ? hdfsPath : `/${hdfsPath}`;
    const mkdirUrl = `${this.baseUrl}${cleanPath}?op=MKDIRS&user.name=${this.username}`;

    try {
      const response = await axios.put(mkdirUrl, null, { timeout: 10000 });
      return response.data?.boolean === true;
    } catch (err: any) {
      throw new Error(`Failed to create directory in HDFS (${cleanPath}): ${err.message}`);
    }
  }
}

// Singleton export
export const hdfsService = new WebHDFSService();
