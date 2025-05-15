#!/bin/bash

# Setup script for Ray cluster monitoring with Prometheus and Grafana
# This script should be run after the containers are started

echo "===================================="
echo "  Setting up Ray Cluster Monitoring"
echo "===================================="

# Define variables
GRAFANA_URL=${GRAFANA_URL:-"http://localhost:3000"}
GRAFANA_USER=${GRAFANA_USER:-"admin"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin"}
PROMETHEUS_URL=${PROMETHEUS_URL:-"http://localhost:9090"}

# Create directories if they don't exist
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Create Prometheus configuration file for Ray cluster monitoring
echo "Creating Prometheus configuration..."
cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "ray-head"
    static_configs:
      - targets: ["ray-head:8265"] # Ray dashboard
        labels:
          node_type: "head"

  - job_name: "ray-worker-1"
    static_configs:
      - targets: ["ray-worker-1:8265"] # Ray dashboard on worker
        labels:
          node_type: "worker"
          
  - job_name: "ray-worker-2"
    static_configs:
      - targets: ["ray-worker-2:8265"] # Ray dashboard on worker
        labels:
          node_type: "worker"

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"] # Node exporter for host metrics
EOF

# Create Grafana dashboard for Ray cluster overview
echo "Creating Grafana dashboards..."
cat > monitoring/grafana/dashboards/ray-cluster-overview.json << EOF
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "percentage": false,
      "pluginVersion": "7.1.3",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "ray_cluster_workers",
          "interval": "",
          "legendFormat": "Workers",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Ray Cluster Workers",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "percentage": false,
      "pluginVersion": "7.1.3",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "ray_cluster_resources_cpu",
          "interval": "",
          "legendFormat": "CPU Resources",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Ray Cluster CPU Resources",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Ray Cluster Overview",
  "uid": "ray-cluster",
  "version": 1
}
EOF

# Create Grafana configuration for datasource
echo "Creating Grafana datasource configuration..."
cat > monitoring/grafana/datasources/prometheus.yaml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create a script to install Node Exporter for host metrics
cat > monitoring/install_node_exporter.sh << EOF
#!/bin/bash
# This script installs Node Exporter for monitoring host metrics

NODE_EXPORTER_VERSION="1.3.1"
wget https://github.com/prometheus/node_exporter/releases/download/v\${NODE_EXPORTER_VERSION}/node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar -xvf node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
cd node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64
cp node_exporter /usr/local/bin/
cat > /etc/systemd/system/node_exporter.service << EOL
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter
EOF

chmod +x monitoring/install_node_exporter.sh

# Add Node Exporter to Docker Compose
echo "Updating docker-compose.yml with Node Exporter service..."
if ! grep -q "node-exporter:" docker-compose.yml; then
  # Add node-exporter to docker-compose.yml - this is just an example
  # In a real environment, you would need to modify the docker-compose.yml properly
  echo "
  # Node Exporter service for host metrics
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - \"9100:9100\"
    restart: always
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
  " >> docker-compose.yml
fi

echo "===================================="
echo "  Setup Complete!"
echo "===================================="
echo "To apply these changes:"
echo "1. Restart Prometheus and Grafana containers"
echo "2. Access Grafana at $GRAFANA_URL (default user/pass: $GRAFANA_USER/$GRAFANA_PASSWORD)"
echo "3. Access Prometheus at $PROMETHEUS_URL"
echo "====================================" 