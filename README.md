# LoadBalanceViz

A visual simulator for load balancing algorithms.

## How to Run
1.  Navigate to the project folder: `C:\Users\vemur\.gemini\antigravity\scratch\load_balancer_viz`
2.  Double-click `index.html` to open it in your web browser.

## Screenshots

Below are visual previews of the LoadBalanceViz simulator. Currently showing placeholder images:

### Screenshot 1: Initial State
![Screenshot 1](assets/images/screenshot-1.svg)
*Placeholder - The default view with servers initialized*

### Screenshot 2: Simulation Running
![Screenshot 2](assets/images/screenshot-2.svg)
*Placeholder - Traffic simulation in action*

### Screenshot 3: Algorithm Selection
![Screenshot 3](assets/images/screenshot-3.svg)
*Placeholder - Different load balancing algorithm selected*

**To generate real screenshots:**
- **Locally**: Run `npm install` then `npm run generate:screenshots`
- **Via GitHub Actions**: Trigger the "Generate Screenshots" workflow manually from the Actions tab

The automated workflow will capture actual screenshots of the running application and commit them back to the repository.

## Features
-   **Algorithms**: Round Robin, Random, Least Connections.
-   **Controls**: Add/Remove servers, adjust simulation speed.
-   **Visuals**: Real-time request particles and server load indicators.
