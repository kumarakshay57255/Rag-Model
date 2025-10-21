# Milvus Vector Database Setup Guide

This project uses Milvus as the vector database for storing and searching document embeddings.

## Prerequisites

- Docker Desktop installed on Windows
- At least 4GB of available RAM
- Ports 19530 and 9091 available

## Quick Start

### 1. Start Milvus with Docker Compose

```powershell
# From the project root directory
docker-compose up -d
```

This will start three containers:
- **milvus-standalone**: Main Milvus server (port 19530)
- **milvus-etcd**: Metadata storage
- **milvus-minio**: Object storage for vectors

### 2. Verify Milvus is Running

```powershell
# Check container status
docker ps

# You should see three containers running:
# - milvus-standalone
# - milvus-etcd
# - milvus-minio
```

### 3. Start the Application

```powershell
# Start the backend server
node server.js
```

You should see:
```
✅ Connected to Milvus successfully!
✅ Collection 'rag_documents' is ready
Server is running on http://localhost:3000
```

### 4. Start the Frontend

```powershell
cd client
npm run dev
```

## Milvus Collection Schema

The application automatically creates a collection named `rag_documents` with:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int64 (AutoID) | Primary key |
| `content` | VarChar(65535) | Document chunk text |
| `embedding` | FloatVector(384) | Vector embedding |
| `source` | VarChar(1000) | Source file/URL |
| `source_type` | VarChar(50) | Type (pdf, csv, url, etc.) |
| `chunk_index` | Int64 | Chunk position |
| `uploaded_at` | VarChar(100) | Timestamp |

**Index**: IVF_FLAT with L2 distance metric (nlist=1024)

## Management Commands

### View Logs
```powershell
docker-compose logs -f milvus
```

### Stop Milvus
```powershell
docker-compose down
```

### Stop and Remove All Data
```powershell
docker-compose down -v
```

### Restart Milvus
```powershell
docker-compose restart
```

## Troubleshooting

### Port Already in Use
If port 19530 is already in use:
```powershell
# Find what's using the port
netstat -ano | findstr :19530

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Out of Memory
Milvus requires at least 4GB of RAM. Close other applications or increase Docker memory limits in Docker Desktop settings.

### Connection Failed
1. Ensure Docker containers are running: `docker ps`
2. Check Milvus logs: `docker-compose logs milvus`
3. Verify port forwarding: `netstat -ano | findstr :19530`
4. Restart containers: `docker-compose restart`

### Clear All Vector Data
Use the application's `/api/clear` endpoint or:
```powershell
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Performance Tuning

### Index Parameters
Current settings in `milvusUtils.js`:
- **nlist**: 1024 (number of clusters for IVF_FLAT)
- **nprobe**: 10 (search scope, higher = more accurate but slower)

For larger datasets (>100k documents):
```javascript
// In milvusUtils.js, increase nlist
index_params: { index_type: "IVF_FLAT", metric_type: "L2", params: { nlist: 2048 } }
```

### Search Parameters
Adjust `topK` in queries for more/fewer results:
```javascript
// In server.js
const sources = await searchSimilar(queryEmbedding, 5); // Change 5 to desired number
```

## API Endpoints with Milvus

All endpoints now use Milvus instead of JSON files:

| Endpoint | Method | Milvus Operation |
|----------|--------|------------------|
| `/api/stats` | GET | `getStats()` - Collection statistics |
| `/api/upload` | POST | `insertEmbeddings()` - Add documents |
| `/api/process-url` | POST | `insertEmbeddings()` - Add web content |
| `/api/query` | POST | `searchSimilar()` - Vector search |
| `/api/query-ai` | POST | `searchSimilar()` + Gemini |
| `/api/clear` | DELETE | `clearCollection()` - Reset database |

## Migration from JSON Storage

The application has been fully migrated from JSON file storage to Milvus:

**Before (JSON)**:
- Stored embeddings in `vectorStore.json`
- Manual cosine similarity calculation
- O(n) search complexity
- Memory-limited capacity

**After (Milvus)**:
- Distributed vector database
- Optimized similarity search with IVF_FLAT index
- O(log n) search complexity
- Scalable to millions of vectors

## Advanced Configuration

### Custom Milvus Address
If running Milvus on a different host:

```javascript
// In milvusUtils.js
const client = new MilvusClient({
  address: process.env.MILVUS_ADDRESS || 'localhost:19530'
});
```

Add to `.env`:
```
MILVUS_ADDRESS=your-milvus-host:19530
```

### Production Deployment
For production use:
1. Use Milvus cluster mode (not standalone)
2. Enable authentication
3. Set up backup and restore
4. Monitor with Prometheus/Grafana

See [Milvus Documentation](https://milvus.io/docs) for details.

## Resources

- [Milvus Official Docs](https://milvus.io/docs)
- [Milvus Node.js SDK](https://github.com/milvus-io/milvus-sdk-node)
- [Docker Compose Reference](https://docs.docker.com/compose/)
