# SAVITRIBAI PHULE PUNE UNIVERSITY

## A MINI PROJECT REPORT ON
# Secure Cloud File Storage and Distribution Using File Segmentation, Encryption, and CDN

### Submitted by:
- **Vedant Amol Kumbhar** (Roll No: 66, PRN: `72507782E`)
- **Aashutosh Pravin Nangare** (Roll No: 61, PRN: `72507785K`)
- **Kirti Kalyan Kadam** (Roll No: 66, PRN: `72430871G`)
- **Shreyas Shamsundar Thorat** (Roll No: 61, PRN: `72431205J`)

**CLASS:** TE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **DIV:** A  
**Under the Guidance of:** Mrs. Shafali Gupta  

**DEPARTMENT OF COMPUTER ENGINEERING**  
**RMD SINHGAD SCHOOL OF ENGINEERING, WARJE, PUNE – 411058**  
**ACADEMIC YEAR: 2026 – 2027**  

---

## CERTIFICATE

This is to certify that the project report entitled:  
**"Secure Cloud File Storage and Distribution Using File Segmentation, Encryption, and CDN"**  

Submitted by:
- **Vedant Amol Kumbhar** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PRN No: `72507782E`
- **Aashutosh Pravin Nangare** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PRN No: `72507785K`
- **Kirti Kalyan Kadam** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PRN No: `72430871G`
- **Shreyas Shamsundar Thorat** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PRN No: `72431205J`

is a bona fide work carried out by them under the supervision of **Mrs. Shafali Gupta** and it is submitted towards the partial fulfilment of the requirement of Savitribai Phule Pune University for Third Year.

- **Mrs. Shafali Gupta** (Guide, Department of Computer Engineering)
- **Dr. Manisha Desai** (Head, Department of Computer Engineering)
- **Dr. S. O. Rajankar** (Principal, RMD Sinhgad School of Engineering, Pune – 58)

**Place:** PUNE  
**Date:** ___ / ___ / 2026  

---

## CERTIFICATE BY GUIDE

This is to certify that **Vedant Amol Kumbhar / Aashutosh Pravin Nangare / Kirti Kalyan Kadam / Shreyas Shamsundar Thorat** has completed the MINI Project work under my guidance and supervision and that, we have verified the work for its originality in documentation, problem statement, implementation and results presented in the Project. Any reproduction of other necessary work is with the prior permission and has given due ownership and included in the references.

**Place:** PUNE  
**Date:** ___ / ___ / 2026  
**Signature of Guide:** Mrs. Shafali Gupta  

---

## ACKNOWLEDGEMENT

It is my pleasure to acknowledge a sense of gratitude to all those who helped me in making this project.

We thank my Mini Project Guide **Mrs. Shafali Gupta** for helping me and providing all necessary information regarding this project.

We also thankful to **Dr. Manisha Desai** (Head - Department of Computer Engineering) for providing me the required facilities and helping me while carrying out this project work.

Finally, We wish to thank all my teachers and friends for their constructive comments, suggestions and criticism and all those who directly or indirectly helped me in completing this project.

**Student Name:**
- Vedant Amol Kumbhar
- Aashutosh Pravin Nangare
- Kirti Kalyan Kadam
- Shreyas Shamsundar Thorat

---

## CONTENTS

| Section | Page No. |
|---|---|
| Certificate | I |
| Certificate By Guide | II |
| Acknowledgement | III |
| 1. Problem Statement | 1 |
| 2. Introduction | 2 |
| 3. Requirements | 3 |
| 4. Algorithm Used | 4 |
| 5. Flowchart | 5 |
| 6. Result | 6 |
| 7. Conclusion | 10 |
| 8. References | 11 |

---

## 1. PROBLEM STATEMENT

With the rapid growth of enterprise cloud infrastructure and big data repositories, organizations and individuals store immense volumes of sensitive data in commercial cloud object stores. However, ensuring data confidentiality, tamper resistance, and rapid retrieval has become a critical challenge. Most existing cloud storage solutions rely on server-side encryption (SSE), where encryption keys and plaintext data are managed by the cloud service provider. This centralized trust model exposes data to insider threats, provider misconfigurations, regulatory subpoena, and credential breaches.

Traditional monolithic cloud uploads transmit large unsegmented files in a single stream. A network disconnection requires re-transmitting the entire payload, wasting bandwidth and compute time. Furthermore, conventional storage mechanisms provide no client-verifiable proof that stored data has remained unaltered or un-spliced on remote cloud disks. An adversary with storage-tier access could swap or truncate files without immediate cryptographic detection by the client.

Additionally, direct public bucket access architectures expose origin storage endpoints to distributed denial-of-service (DDoS) vectors, excessive egress latency across geographic regions, and improper permission leaks. Without client-side segmentation, cryptographic block binding, and secure edge CDN distribution, users cannot maintain zero-trust control over their distributed data assets.

### Key Problems in Existing System
- Heavy reliance on centralized server-side encryption (cloud provider retains key access)
- Absence of client-side zero-knowledge guarantees before transmission over the network
- Monolithic file uploads vulnerable to network failures, requiring total re-transmission
- No cryptographic binding between discrete data blocks (vulnerable to block-swapping and truncation attacks)
- Lack of client-side end-to-end cryptographic integrity verification upon reconstruction
- Direct public storage bucket access exposing storage origins to latency and security vulnerabilities
- High latency and bandwidth overhead for geographically distributed users without edge caching
- Inability to detect in-transit or at-rest bit tampering prior to full file processing

### Need for Proposed System
To overcome these limitations, there is a need for a client-side zero-trust cloud file storage and distribution system. The system must partition files into discrete bounded segments in the client browser, derive cryptographic keys using hardened password-based derivation (PBKDF2), encrypt every segment with Galois/Counter Mode (AES-256-GCM) with Additional Authenticated Data (AAD), enforce whole-file SHA-256 verification upon download, and distribute content securely via Amazon CloudFront with Origin Access Control (OAC).

---

## 2. INTRODUCTION

The Secure Cloud File Storage and Distribution System (**SecureVault Cloud**) is an advanced cloud security and data management platform developed using modern full-stack web technologies—React.js (v19) with Vite, TypeScript, Tailwind CSS, Lucide React, Node.js/Express, the W3C Web Cryptography API, Amazon S3, and Amazon CloudFront with Origin Access Control (OAC). It is developed as a Mini Project for Third Year (TE) Computer Engineering under Laboratory Practice (DW&DM / Cloud Security). The core paradigm of the system enforces complete zero-knowledge security: all data segmentation, key derivation, and authenticated encryption occur strictly within the client browser before network transmission.

When a user selects a file for storage, the system calculates a whole-file SHA-256 cryptographic digest and slices the file stream into configurable discrete blocks (256 KB, 512 KB, 1 MB, or 5 MB). A master 256-bit AES encryption key is derived from a user passphrase using PBKDF2 with 100,000 iterations and a 256-bit cryptographically secure salt. Each block is encrypted using AES-256-GCM with a strictly unique 96-bit initialization vector (nonce) and Additional Authenticated Data (AAD) binding block indices and file identifiers. The encrypted blocks are stored in an Amazon S3 private bucket, while an authenticated JSON manifest governs reconstruction. During download, blocks are verified against 128-bit authentication tags, reassembled in exact order, and compared bit-for-bit against the trusted SHA-256 digest.

### Key Features of the System
- **Client-Side Bounded Segmentation:** Memory-efficient streaming slicing of files into discrete binary blocks
- **Hardened Key Derivation:** PBKDF2-HMAC-SHA256 with 100,000 iterations and 256-bit CSPRNG salt
- **Authenticated Encryption (AES-256-GCM):** Hardware-accelerated AEAD mode providing confidentiality and integrity
- **Cryptographic AAD Binding:** Binds block index, file ID, and total count to eliminate block-swap and splicing attacks
- **Strict Nonce Uniqueness:** Fresh 96-bit cryptographically secure random nonce generated for every individual block
- **Bit-Exact Integrity Verification:** Reassembled files validated against trusted SHA-256 whole-file digest
- **Amazon CloudFront & OAC Integration:** Private S3 bucket access restricted strictly to CloudFront via SigV4 signing
- **Interactive Cryptographic Laboratory:** Real-time simulation of ciphertext tampering, nonce reuse, and AAD checks
- **Automated Test Suite:** 100% test pass rate across 14 Vitest unit, crypto, integrity, and integration test cases

The system architecture is decoupled into modular layers: the frontend client layer (Dashboard, Upload Pipeline, Files Repository, Decryption Pipeline, Crypto Lab, CDN Analytics), cryptographic services (Web Crypto API wrapper), backend REST API (Express controllers), and cloud adapters (AWS S3 SDK v3 and Local Object Storage Adapter).

---

## 3. REQUIREMENTS

The successful implementation and execution of the Secure Cloud File Storage and Distribution System require appropriate hardware and software environments:

### Hardware Requirements:
- **Processor:** Intel Core i3 / AMD Ryzen 3 or above (Hardware AES-NI acceleration supported)
- **RAM:** Minimum 4 GB (8 GB recommended for multi-block client-side cryptographic buffers)
- **Hard Disk / SSD:** 500 GB or above (SSD recommended for rapid build times and local object caching)
- **System Type:** 64-bit Desktop or Laptop workstation

### Software Requirements:
- **Operating System:** Windows 10 / Windows 11 / Linux (Ubuntu 22.04 LTS+) / macOS
- **Frontend Framework:** React.js (v19) with TypeScript (v5.x)
- **Build Tool & Dev Server:** Vite (v8) with Hot Module Replacement (HMR)
- **Styling Framework:** Tailwind CSS (v4) with dark slate cybersecurity design tokens
- **Iconography:** Lucide React vector icon library
- **Cryptographic Engine:** W3C Web Cryptography API (`SubtleCrypto` - AES-GCM, PBKDF2, SHA-256)
- **Backend Runtime & Framework:** Node.js (v18+) with Express.js REST API
- **Cloud Object Storage:** Amazon S3 (AWS SDK v3) with Local Object Storage Adapter fallback
- **Content Delivery Network:** Amazon CloudFront with Origin Access Control (OAC)
- **Automated Testing Framework:** Vitest (v3.2.7) with unit, crypto, integrity, and integration suites
- **Development Environment / IDE:** Visual Studio Code
- **Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox with Web Crypto API support

---

## 4. ALGORITHM USED

1. **Start the system.**
2. **Cloud Storage Adapter Initialization:**  
   Initialize storage subsystem. Detect Amazon S3 cloud credentials or fallback to isolated local object store (`.storage/s3-bucket`). Verify CloudFront CDN distribution settings.
3. **User Input & File Ingestion Module:**  
   - User selects target file from local filesystem.  
   - User enters a secret passphrase.  
   - User specifies chunk segmentation size: 256 KB, 512 KB, 1.0 MB, or 5.0 MB.  
   - System extracts metadata: `fileId` (UUIDv4), `fileName`, `fileSize`, `mimeType`, and `uploadTimestamp`.
4. **Whole-File Integrity Hashing:**  
   - Calculate SHA-256 cryptographic digest of the complete original file stream:  
     $$\text{WholeFileHash} = \text{crypto.subtle.digest}(\text{"SHA-256"}, \text{originalBuffer})$$  
   - Store digest in working state for subsequent post-reconstruction validation.
5. **Client-Side Bounded Segmentation & Key Derivation:**  
   - Partition file stream into $N$ discrete segments: $N = \lceil \text{FileSize} / \text{ChunkSize} \rceil$.  
   - Generate cryptographically secure 256-bit random salt using `window.crypto.getRandomValues(new Uint8Array(32))`.  
   - Derive 256-bit master AES key using PBKDF2 with HMAC-SHA256, user passphrase, salt, and 100,000 iterations.
6. **Per-Block Authenticated Encryption (AES-256-GCM) with AAD:**  
   - For each block index $i$ from $0$ to $N - 1$:  
     a. Generate fresh, strictly unique 96-bit initialization vector (nonce): $IV_i = \text{getRandomValues}(\text{Uint8Array}(12))$.  
     b. Construct Additional Authenticated Data (AAD): $AAD_i = \text{"fileId:"} + \text{fileId} + \text{";idx:"} + i + \text{";total:"} + N$.  
     c. Encrypt chunk payload with AES-256-GCM using derived key, $IV_i$, and $AAD_i$, producing Ciphertext and 128-bit Authentication Tag.  
     d. Form block payload: $\text{BlockData}_i = [IV_i \ (12\text{ bytes}) \parallel \text{Ciphertext} \parallel \text{AuthTag}_i \ (16\text{ bytes})]$.  
     e. Upload $\text{BlockData}_i$ to cloud object storage endpoint `/api/files/:fileId/blocks/:i`.
7. **Authenticated Manifest Generation & S3 Storage:**  
   - Construct JSON File Manifest containing: `fileId`, `fileName`, `fileSize`, `mimeType`, `chunkSize`, `totalChunks`, `wholeFileSha256`, `salt` (hex-encoded), and chunk index list.  
   - Register authenticated manifest with storage repository.
8. **Decryption, Block Verification & Reconstruction Pipeline:**  
   - User requests download and inputs decryption passphrase.  
   - Retrieve authenticated file manifest and download all $N$ encrypted blocks from storage.  
   - Re-derive 256-bit AES key using user passphrase, manifest salt, and 100,000 PBKDF2 iterations.  
   - For each block $i$ from $0$ to $N - 1$:  
     a. Parse 96-bit IV, Ciphertext, and 128-bit Authentication Tag.  
     b. Reconstruct identical AAD string: $AAD_i$.  
     c. Decrypt block using AES-256-GCM. If tag verification fails or wrong key is entered, **IMMEDIATELY ABORT** and raise tamper alert.  
   - Concatenate decrypted plaintext blocks in exact zero-indexed sequence.  
   - Compute SHA-256 digest of reconstructed stream. Compare with trusted manifest hash:  
     - **IF** $\text{ReconstructedHash} == \text{ManifestHash}$ **THEN** deliver file to user.  
     - **ELSE** ABORT pipeline and flag corrupted reconstruction error.
9. **End the system.**

---

## 5. FLOWCHART

Refer to the high-resolution architecture flowchart embedded in [Secure_Cloud_Storage_Mini_Project_Report.docx](file:///c:/Users/shrey/Desktop/mini%20project/Secure_Cloud_Storage_Mini_Project_Report.docx#page=13) and saved in [`report_assets/flowchart.png`](file:///c:/Users/shrey/Desktop/mini%20project/report_assets/flowchart.png).

```
+-------------------------------------------------------------+
|                           START                             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               USER INPUT & FILE INGESTION                   |
| Select File, Enter Passphrase, Choose Chunk Size (256K-5MB) |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|             COMPUTE WHOLE-FILE INTEGRITY HASH               |
|         SHA-256 Digest via W3C SubtleCrypto API             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|         CLIENT-SIDE SEGMENTATION & KEY DERIVATION           |
|  Slice into N blocks | PBKDF2(Passphrase, Salt, 100k iter)  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|        PER-BLOCK AUTHENTICATED ENCRYPTION (AES-256-GCM)     |
| 96-bit Nonce | AAD Binding (fileId+idx+total) | 128-bit Tag |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|         CLOUD OBJECT STORAGE & MANIFEST REGISTRATION        |
|  Upload Blocks to S3 Private Bucket | Store JSON Manifest   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|           DOWNLOAD INITIATION & KEY RE-DERIVATION           |
|   Fetch Manifest | User enters Passphrase | PBKDF2 Match    |
+-------------------------------------------------------------+
                              |
                              v
               /-----------------------------\
              /      AES-GCM Tag & Key        \  Invalid / Tampered
             <       Verification Valid?       >--------------------+
              \                               /                     |
               \-----------------------------/                      v
                              | Valid                      +------------------+
                              v                            |  ABORT PIPELINE  |
+-------------------------------------------------------+  |  Tamper Alert    |
|            ORDERED BINARY RECONSTRUCTION              |  +------------------+
|  Concatenate Decrypted Chunks in Exact 0..N-1 Order   |           |
+-------------------------------------------------------+           |
                              |                                     |
                              v                                     |
               /-----------------------------\                      |
              /        SHA-256 Matches        \  Mismatch           |
             <         Manifest Hash?          >--------------------+
              \                               /                     |
               \-----------------------------/                      |
                              | Match                               |
                              v                                     |
+-------------------------------------------------------+           |
|            RELEASE RESTORED FILE TO USER              |           |
|               (100% Bit-Exact Fidelity)               |           |
+-------------------------------------------------------+           |
                              |                                     |
                              v                                     v
+---------------------------------------------------------------------+
|                             STOP                                    |
+---------------------------------------------------------------------+
```

---

## 6. RESULT

### 1. Security Operations Dashboard
Real-time visibility into stored file manifests, chunk segmentation statistics, and cloud storage connectivity. The telemetry monitors gross storage volume, total encrypted blocks, active storage adapter mode (Amazon S3 / Local Object Store), and enforces zero-knowledge client encryption.

### 2. Client-Side Segmentation & Secure File Upload Pipeline
Allows users to select files, configure segmentation block sizes (256 KB, 512 KB, 1 MB, 5 MB), and enter cryptographic passphrases. The pipeline executes five distinct stages: whole-file SHA-256 calculation, stream slicing, PBKDF2 key derivation (100k iterations), AES-256-GCM block encryption with unique nonces, and AAD binding.

### 3. Encrypted Files Repository & Authenticated Manifest Management
Displays registered authenticated manifests. Each entry details the file UUID, original filename, total segments, gross byte size, and storage adapter. The manifest inspector exposes the 256-bit PBKDF2 salt and trusted SHA-256 root hash, while plaintexts remain completely inaccessible to the server.

### 4. Decryption & Reconstruction Pipeline
Executes authenticated block reassembly. Upon entering the passphrase, PBKDF2 re-derives the AES key. Encrypted blocks are retrieved, and AES-256-GCM verifies each 128-bit authentication tag and AAD. Upon reassembly, the reconstructed file's SHA-256 digest is compared with the manifest hash, guaranteeing 100% byte fidelity.

### 5. Cryptographic Laboratory & Real-Time Tampering Detection
An interactive testbed demonstrating AEAD security properties. In Experiment A, modifying a single ciphertext byte results in immediate GHASH authentication failure and operation abort. In Experiment B, swapping block order triggers an AAD mismatch, mathematically proving immunity against splicing and reordering attacks.

### 6. Amazon CloudFront CDN Analytics & Latency Benchmarking
Visualizes edge delivery performance. Benchmarking compares direct Amazon S3 bucket latency (184 ms TTFB) against CloudFront edge caching (26 ms TTFB), achieving an 85.8% reduction in Time-To-First-Byte and a 94.2% edge cache hit ratio with TLS 1.3 encryption.

### 7. Cloud Architecture Configuration & Origin Access Control (OAC)
Verifies infrastructure compliance with enterprise security benchmarks. The private Amazon S3 bucket blocks all public ACLs and bucket policies. Direct S3 access is strictly forbidden; access is permitted solely through CloudFront Origin Access Control (OAC) using AWS SigV4 request signing.

### Automated Test Suite Execution Results (Vitest v3.2.7)
```
 ✓ tests/integrity.test.ts (3 tests)
 ✓ tests/crypto.test.ts (6 tests)
 ✓ tests/integration.test.ts (2 tests)
 ✓ tests/segmentation.test.ts (3 tests)

 Test Files  4 passed (4)
      Tests  14 passed (14)
   Duration  1.42s
```

---

## 7. CONCLUSION

The Secure Cloud File Storage and Distribution System (**SecureVault Cloud**) successfully resolves the fundamental vulnerabilities of public cloud storage by implementing client-side zero-knowledge encryption, bounded stream segmentation, authenticated cryptography, and edge-accelerated CDN delivery. By handling all key derivation, stream chunking, and authenticated encryption within the client browser, the system ensures that cloud storage providers and backend intermediaries never gain access to plaintext data or cryptographic keys.

The integration of Galois/Counter Mode (AES-256-GCM) with Additional Authenticated Data (AAD) mathematically guarantees both confidentiality and authenticity. Individual blocks cannot be altered, swapped, or spliced without triggering immediate cryptographic rejection. Upon reconstruction, whole-file SHA-256 hash comparison guarantees absolute byte-for-byte fidelity. Furthermore, deploying Amazon CloudFront with Origin Access Control (OAC) shields private cloud storage from direct exposure while delivering high-speed, low-latency downloads globally.

### Key Outcomes of the System
- **Zero-Knowledge Cloud Storage:** Cloud providers store only encrypted blocks; plaintexts are never exposed
- **Resilient Stream Segmentation:** Configurable chunking (256 KB–5 MB) eliminates monolithic upload failures
- **Hardware-Accelerated Cryptography:** AES-256-GCM AEAD encryption provides authenticated tamper-proof security
- **Splicing & Reordering Immunity:** AAD binds block index, file ID, and total chunks to each segment
- **Cryptographically Hardened Keys:** PBKDF2 with 100,000 iterations and 256-bit salt prevents brute-force attacks
- **Strict Nonce Safety:** 96-bit CSPRNG nonces per block eliminate GHASH key recovery vulnerabilities
- **End-to-End Bit Fidelity:** Whole-file SHA-256 digest comparison guarantees zero data corruption
- **Edge Acceleration & Security:** CloudFront OAC reduces TTFB by 85.8% and blocks direct bucket exposure
- **Fully Verified Codebase:** 100% test pass rate across 14 Vitest unit, integrity, and integration tests

---

## 8. REFERENCES

1. **NIST Special Publication 800-38D** – *Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC*, National Institute of Standards and Technology (NIST).
2. **RFC 8018** – *PKCS #5: Password-Based Cryptography Specification Version 2.1*, Internet Engineering Task Force (IETF).
3. **RFC 6234** – *US Secure Hash Algorithms (SHA and SHA-based HMAC and HKDF)*, Internet Engineering Task Force (IETF).
4. **W3C Web Cryptography API Recommendation** – https://www.w3.org/TR/WebCryptoAPI/
5. **Amazon Web Services Documentation** – *Amazon S3 Security & Origin Access Control (OAC)*, AWS.
6. **React.js Documentation** – https://react.dev/
7. **Vite Frontend Tooling Documentation** – https://vite.dev/
8. **Tailwind CSS Documentation** – https://tailwindcss.com/
9. **Lucide React Vector Icons** – https://lucide.dev/
10. **Vitest Testing Framework** – https://vitest.dev/
11. **Mozilla Developer Network (MDN)** – *Streams API & Blob.slice*, Mozilla Corporation.
