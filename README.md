# 🚀 Hyperledger Indy - Dynamic Cluster Generator

This project automates the generation of **Shell scripts** and **Docker Compose files** to spin up **Hyperledger Indy** node clusters for load testing and fault tolerance experiments.

Built with **Node.js** and **Docker**.

---

## 📖 What It Does

- Dynamically creates `.sh` and `.yaml` files based on the number of nodes.
- Automates ledger initialization if it doesn't exist.
- Spins up Indy nodes, client, webserver, and sync test services.
- Helps run load benchmarks and simulate node failures.

---

## 🛠️ How to Use

### 1. Clone the repository
```bash
git clone https://github.com/sagar-j-rao/Dynamic-Node-Generation.git
cd Dynamic-Node-Generation
```

### 2. Generate cluster files
```bash
node generate.js --number=4
```
This creates:
- `4-dynamic_start_nodes.sh`
- `4-dynamic_docker-compose.yaml`

### 3. Start the network
```bash
docker-compose -f 4-dynamic_docker-compose.yaml up
```

---

## ⚙️ Tech Stack

- Node.js (JavaScript)
- Docker
- Shell scripting
- Hyperledger Indy
