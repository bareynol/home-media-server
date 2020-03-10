const si = require('systeminformation');

const DOCKER_CONTAINERS = [
  'plex',
  'transmission',
  'jackett',
  'radarr',
  'sonarr',
  'tautulli',
  'ombi',
]

async function getDockerContainerData() {
  const dockerContainers = await si.dockerContainers(true);

  const data = {};

  dockerContainers.forEach(dc => {
    const containerName = dc.name;
    if (isValidContainer(containerName)) {
      const running = dc.state === 'running';
      const uptime = !running ? 0 : getUptime(dc.started);
      const downtime = running ? 0 : getDowntime(dc.finished);

      data[containerName] = {
        running,
        uptime,
        downtime,
      }
    }
  })

  return data;

}

function getUptime(started) {
  return Math.round((Date.now() / 1000) - started)
}

function getDowntime(finished) {
  return Math.round((Date.now() / 1000) - finished)
}

function isValidContainer(name) {
  return DOCKER_CONTAINERS.includes(name)
}

module.exports = {
  getDockerContainerData,
}