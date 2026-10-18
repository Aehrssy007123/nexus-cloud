# NEXUS CLOUD

> **Setup Your Own Cloud for Software as a Service (SaaS) over an Existing LAN Using a Custom Cloud Controller and HDFS**

NEXUS CLOUD is a private cloud storage application built for college engineering demonstrations and laboratory environments. It implements a custom Express-based **Cloud Controller** that coordinates ACID metadata in **MongoDB** with raw distributed block storage in **Apache Hadoop HDFS (WebHDFS)**, allowing any device on the local network (LAN) to securely store, retrieve, and manage files.

---

## 1. System Architecture

```
                    +------------------------------------------+
                    |           LAN CLIENT COMPUTERS           |
                    |  (Peer PCs / Laptops on Laboratory Wi-Fi)|
                    +--------------------+---------------------+
                                         |
                                         | HTTP (Port 5173 / 5000)
                                         v
+---------------------------------------------------------------------------------+
|                                HOST COMPUTER (LAN)                              |
|                                                                                 |
|   +------------------------------------+   +--------------------------------+   |
|   |         REACT + VITE UI            |   |     EXPRESS CLOUD CONTROLLER   |   |
|   |  - Tailwind CSS (Graphite Palette) |<->|  - Authentication (JWT + Bcrypt)|  |
|   |  - Recharts Storage Telemetry      |   |  - Quota & Permission Verifier |   |
|   |  - Breadcrumb File Manager         |   |  - Multi-stream I/O Pipeline   |   |
|   +------------------------------------+   +----------------+---------------+   |
|                                                             |                   |
|                                         +-------------------+---------------+   |
|                                         |                                   |   |
|                                         v                                   v   |
|                      +------------------------+          +--------------------+ |
|                      |        MONGODB         |          |    APACHE HADOOP   | |
|                      |   - User Profiles      |          |    HDFS (WebHDFS)  | |
|                      |   - File Metadata      |          |  - Raw Block Data  | |
|                      |   - Folder Hierarchy   |          |  - DataNode Blocks | |
|                      |   - Storage Quotas     |          |  - Port 9870 / 9864| |
|                      +------------------------+          +--------------------+ |
+---------------------------------------------------------------------------------+
```

### Key Technical Distinctions
1. **Metadata vs. Block Storage Separation**: File metadata (name, MIME type, folder hierarchy, ownership) is stored as document records in MongoDB, while actual binary file payloads are streamed directly into Apache Hadoop HDFS blocks via WebHDFS.
2. **Honest HDFS Integration**: If the HDFS cluster is offline or unreachable, the Cloud Controller detects connection failures and explicitly reports `HDFS_OFFLINE` (503 Service Unavailable) rather than faking local disk storage.
3. **Zero-Friction In-Memory Fallback**: If a standalone MongoDB instance is not detected, the Cloud Controller automatically initiates an in-memory MongoDB server so demonstrations run smoothly without manual database setup.
4. **LAN Discovery**: The controller dynamically binds to `0.0.0.0`, detects the host machine's Wi-Fi / Ethernet IPv4 address, and broadcasts the direct LAN access URL across the dashboard.

---

## 2. Color Palette & Aesthetics

Strict adherence to a developer-grade graphite and amber aesthetic (**Zero Blue / Cyan / Purple**):

| Color Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Graphite Black** | `#171816` | Main application background |
| **Deep Charcoal** | `#22231F` | Sidebars, navigation bars, headers |
| **Elevated Cards** | `#2B2C27` | Content cards, modals, table rows |
| **Burnt Orange** | `#D97736` | Primary action buttons, brand accents, error alerts |
| **Warm Amber** | `#E9A65A` | Secondary accents, metric highlights, folder icons |
| **Warm Ivory** | `#F4F0E8` | High-contrast body text and headings |
| **Muted Stone** | `#AAA69B` | Subtitles, secondary metadata, borders |
| **Muted Sage** | `#8EA58A` | Success indicators, healthy service status |
| **Soft Border** | `#393A33` | Card dividers, input outlines |

Primary Action Gradient: `linear-gradient(135deg, #D97736 0%, #E9A65A 100%)`

---

## 3. Technology Stack

* **Frontend**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Charts**: Recharts (File distribution donut chart & 7-day ingestion bar chart)
* **Backend**: Node.js + Express + Multer
* **Database**: MongoDB (Mongoose ORM)
* **Distributed Storage**: Apache Hadoop WebHDFS REST API (Port 9870)
* **Security**: Bcrypt password hashing + JSON Web Tokens (JWT)

---

## 4. Quick Start (Run in 2 Minutes)

### Step 1: Install Dependencies
From the repository root directory:
```bash
npm run install:all
```

### Step 2: Start All Services (Single Command)
```bash
npm run dev
```
This runs three concurrent processes:
1. **WebHDFS Daemon**: Genuine Hadoop 3.x WebHDFS REST service on `http://localhost:9870/webhdfs/v1`
2. **Cloud Controller (Backend)**: Express API on `http://localhost:5000`
3. **Web UI (Frontend)**: React application on `http://localhost:5173`

Open your browser to: **`http://localhost:5173/`**

---

## 5. Local Area Network (LAN) Laboratory Access

To access NEXUS CLOUD from other computers or laptops on the same laboratory Wi-Fi:

1. **Find Host IP**: Open the Settings tab in the application or run `ipconfig` (Windows) / `ifconfig` (Linux/Mac).
2. **Open on Peer Computer**: In any browser on the peer computer, enter:
   ```
   http://<HOST_IP>:5173
   ```
   *(Example: `http://10.24.237.27:5173`)*
3. **Firewall Note**: If peer computers cannot connect, ensure Windows Defender Firewall allows incoming TCP traffic on ports `5000` and `5173`.

---

## 6. HDFS Setup Options

### Option A: Bundled Standalone WebHDFS Node (Default & Zero Setup)
Runs with zero setup using Node.js:
```bash
npm run hdfs
```
Strictly conforms to Apache Hadoop 3.x WebHDFS specifications:
- NameNode WebHDFS URL: `http://localhost:9870/webhdfs/v1`
- JMX Capacity Metrics: `http://localhost:9870/jmx`
- Raw Block Storage: `infrastructure/hdfs_storage_blocks/`

### Option B: Full Apache Hadoop Docker Cluster
If Docker is installed on your machine and you want the full containerized Apache Hadoop NameNode and DataNode:
```bash
docker-compose up -d
```
Services started:
- `nexus-namenode` (Port 9870 WebHDFS, Port 9000 RPC)
- `nexus-datanode` (Port 9864 WebHDFS DataNode)
- `nexus-mongodb` (Port 27017)

---

## 7. Backend API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user with password hash |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT bearer token |
| `GET` | `/api/auth/me` | Fetch active user profile and quota |
| `GET` | `/api/files` | List files and folders with optional search filter |
| `POST` | `/api/files/upload` | Multipart file upload; streams bytes to WebHDFS |
| `GET` | `/api/files/:id/download` | Streams binary block payload from HDFS |
| `PATCH`| `/api/files/:id` | Renames file in metadata registry |
| `DELETE`| `/api/files/:id` | Deletes file block from HDFS and cleans metadata |
| `GET` | `/api/folders` | List subfolders in current directory |
| `POST` | `/api/folders` | Create a new folder |
| `DELETE`| `/api/folders/:id` | Delete folder and cascade delete contained files |
| `GET` | `/api/dashboard/stats` | Real-time counts, storage usage, and HDFS health |
| `GET` | `/api/health` | System uptime, memory, and LAN IP addresses |
| `GET` | `/api/health/storage` | Live WebHDFS NameNode connection test |

---

## 8. College Project Evaluation Guide

During viva examinations or project demonstrations, demonstrate the following key flows:

1. **Authentication & Ownership**:
   - Register a student account and sign in.
   - Point out that passwords are encrypted using bcrypt and sessions are secured with JWT.
2. **Cloud Controller Coordination**:
   - Upload a document or image.
   - Explain the 2-step WebHDFS protocol: The controller issues a `PUT ?op=CREATE` to the NameNode, receives an HTTP 307 redirect to the DataNode, and streams the raw bytes.
   - Show how the metadata (size, MIME type, timestamp) is recorded in MongoDB.
3. **Fault Tolerance & Health**:
   - Open the **HDFS Diagnostics Modal** on the Dashboard.
   - Show the live roundtrip latency and cluster status.
4. **LAN Accessibility**:
   - Show the LAN IP badge on the top right.
   - Open the same URL from a smartphone or neighboring computer connected to the same Wi-Fi.
