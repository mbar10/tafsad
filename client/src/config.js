// src/config.js
let config = null;

export const loadConfig = async () => {
  if (!config) {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to load config.json');
    }
    config = await response.json();
  }
  return config;
};

export const getConfig = () => {
  if (!config) {
    throw new Error('Config not loaded yet. Call loadConfig() first.');
  }
  return config;
};
