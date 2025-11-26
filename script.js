class LoadBalancerApp {
    constructor() {
        this.servers = [];
        this.requests = [];
        this.isRunning = false;
        this.algorithm = 'round-robin';
        this.rrIndex = 0; // For Round Robin
        this.requestSpeed = 1;
        this.requestInterval = null;
        this.stats = {
            total: 0,
            dropped: 0
        };

        this.initDOM();
        this.bindEvents();

        // Add initial servers
        this.addServer();
        this.addServer();
        this.addServer();
    }

    initDOM() {
        this.dom = {
            serverContainer: document.getElementById('server-container'),
            vizContainer: document.getElementById('viz-container'),
            clientNode: document.querySelector('.client-node'),
            lbNode: document.querySelector('.lb-node'),

            // Controls
            btnStart: document.getElementById('btn-start'),
            btnStop: document.getElementById('btn-stop'),
            btnAddServer: document.getElementById('btn-add-server'),
            btnRemoveServer: document.getElementById('btn-remove-server'),
            algoSelect: document.getElementById('algorithm-select'),
            speedRange: document.getElementById('speed-range'),
            speedVal: document.getElementById('speed-val'),

            // Stats
            statTotal: document.getElementById('stat-total'),
            statServers: document.getElementById('stat-servers'),
            statDropped: document.getElementById('stat-dropped'),
            statusText: document.getElementById('status-text'),
            statusIndicator: document.querySelector('.status-indicator')
        };
    }

    bindEvents() {
        this.dom.btnStart.addEventListener('click', () => this.startSimulation());
        this.dom.btnStop.addEventListener('click', () => this.stopSimulation());
        this.dom.btnAddServer.addEventListener('click', () => this.addServer());
        this.dom.btnRemoveServer.addEventListener('click', () => this.removeServer());

        this.dom.algoSelect.addEventListener('change', (e) => {
            this.algorithm = e.target.value;
            this.rrIndex = 0; // Reset RR index on change
        });

        this.dom.speedRange.addEventListener('input', (e) => {
            this.requestSpeed = parseInt(e.target.value);
            this.dom.speedVal.textContent = `${this.requestSpeed}x`;
            if (this.isRunning) {
                this.restartInterval();
            }
        });
    }

    // --- Server Management ---

    addServer() {
        if (this.servers.length >= 8) return; // Max limit for visual clarity

        const id = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const server = {
            id,
            load: 0,
            element: this.createServerElement(id, this.servers.length + 1)
        };

        this.servers.push(server);
        this.dom.serverContainer.appendChild(server.element);
        this.updateStats();
    }

    removeServer() {
        if (this.servers.length === 0) return;

        const server = this.servers.pop();
        server.element.remove();
        this.updateStats();

        // Reset RR index if out of bounds
        if (this.rrIndex >= this.servers.length) {
            this.rrIndex = 0;
        }
    }

    createServerElement(id, index) {
        const div = document.createElement('div');
        div.className = 'server-node';
        div.id = id;
        div.innerHTML = `
            <div class="server-info">
                <span class="server-name">Server ${index}</span>
                <span class="server-load">Load: 0 reqs</span>
            </div>
            <div class="server-status-dot"></div>
        `;
        return div;
    }

    // --- Simulation Logic ---

    startSimulation() {
        if (this.isRunning) return;
        this.isRunning = true;

        this.dom.btnStart.disabled = true;
        this.dom.btnStop.disabled = false;
        this.dom.statusText.textContent = 'System Active';
        this.dom.statusIndicator.classList.add('busy');
        this.dom.statusIndicator.classList.remove('ready');

        this.restartInterval();
    }

    stopSimulation() {
        this.isRunning = false;
        clearInterval(this.requestInterval);

        this.dom.btnStart.disabled = false;
        this.dom.btnStop.disabled = true;
        this.dom.statusText.textContent = 'System Ready';
        this.dom.statusIndicator.classList.remove('busy');
        this.dom.statusIndicator.classList.add('ready');
    }

    restartInterval() {
        clearInterval(this.requestInterval);
        // Base interval 2000ms, divided by speed
        const interval = 2000 / this.requestSpeed;
        this.requestInterval = setInterval(() => this.generateRequest(), interval);
    }

    generateRequest() {
        this.stats.total++;
        this.updateStats();

        // Visual: Create particle at Client
        this.animateRequest();
    }

    // --- Core Algorithm Logic ---

    selectServer() {
        if (this.servers.length === 0) return null;

        let selected = null;

        switch (this.algorithm) {
            case 'round-robin':
                selected = this.servers[this.rrIndex];
                this.rrIndex = (this.rrIndex + 1) % this.servers.length;
                break;

            case 'random':
                const randIndex = Math.floor(Math.random() * this.servers.length);
                selected = this.servers[randIndex];
                break;

            case 'least-connections':
                // Simple simulation: pick server with lowest 'load' property
                // Note: In this simple sim, load is just a counter we increment/decrement
                selected = this.servers.reduce((prev, curr) =>
                    prev.load < curr.load ? prev : curr
                );
                break;
        }
        return selected;
    }

    // --- Animation & Visualization ---

    animateRequest() {
        const particle = document.createElement('div');
        particle.className = 'request-particle';
        this.dom.vizContainer.appendChild(particle);

        // 1. Start at Client
        const clientRect = this.dom.clientNode.getBoundingClientRect();
        const containerRect = this.dom.vizContainer.getBoundingClientRect();

        const startX = clientRect.left - containerRect.left + clientRect.width / 2;
        const startY = clientRect.top - containerRect.top + clientRect.height / 2;

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        // 2. Move to Load Balancer
        const lbRect = this.dom.lbNode.getBoundingClientRect();
        const lbX = lbRect.left - containerRect.left + lbRect.width / 2;
        const lbY = lbRect.top - containerRect.top + lbRect.height / 2;

        // Animation Step 1: Client -> LB
        const duration1 = 500 / this.requestSpeed;

        particle.animate([
            { transform: 'translate(-50%, -50%)' },
            { transform: `translate(${lbX - startX}px, ${lbY - startY}px)` }
        ], {
            duration: duration1,
            easing: 'linear',
            fill: 'forwards'
        }).onfinish = () => {
            // Arrived at LB. Decide where to go.
            const targetServer = this.selectServer();

            if (!targetServer) {
                // Drop request
                particle.classList.add('error');
                this.stats.dropped++;
                this.updateStats();
                setTimeout(() => particle.remove(), 200);
                return;
            }

            // Animation Step 2: LB -> Server
            const serverRect = targetServer.element.getBoundingClientRect();
            const serverX = serverRect.left - containerRect.left + 10; // slightly offset
            const serverY = serverRect.top - containerRect.top + serverRect.height / 2;

            // Update server load (simulated)
            targetServer.load++;
            this.updateServerUI(targetServer);

            const duration2 = 500 / this.requestSpeed;

            particle.animate([
                { transform: `translate(${lbX - startX}px, ${lbY - startY}px)` },
                { transform: `translate(${serverX - startX}px, ${serverY - startY}px)` }
            ], {
                duration: duration2,
                easing: 'linear',
                fill: 'forwards'
            }).onfinish = () => {
                // Arrived at Server
                particle.classList.add('success');

                // Simulate processing time
                setTimeout(() => {
                    particle.remove();
                    targetServer.load = Math.max(0, targetServer.load - 1);
                    this.updateServerUI(targetServer);
                }, 1000);
            };
        };
    }

    updateServerUI(server) {
        const loadSpan = server.element.querySelector('.server-load');
        loadSpan.textContent = `Load: ${server.load} reqs`;

        if (server.load > 5) {
            server.element.classList.add('overloaded');
        } else {
            server.element.classList.remove('overloaded');
        }
    }

    updateStats() {
        this.dom.statTotal.textContent = this.stats.total;
        this.dom.statServers.textContent = this.servers.length;
        this.dom.statDropped.textContent = this.stats.dropped;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LoadBalancerApp();
});
