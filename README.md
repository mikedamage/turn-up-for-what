# Turnip 💡

Monitor sensors and execute actions based on their readings.

## About

Turnip monitors data sources (sensors), reading values from them at user-defined intervals. It uses rules to decide what
to do based on the readings.

It was initially built with temperature control in mind, but it's flexible enough to be used for any application where
simple decisions need to be made based on current conditions.

## Installation

TODO

## Configuration

Turnip is configured via a JSON file that has the following sections:

- `socket`: a UNIX domain socket to listen for control commands on. Used by `tufwctl` to interact with a running `tufwd` process.
- `sensors`: an array of objects naming and configuring data sources
- `outputs`: an array of objects naming and configuring "outputs" - e.g. GPIO pins, scripts to run, etc.
- `rules`: an array containing rule objects describing what to do when sensors return particular values

### Example Config

I use these rules to keep my graphics card in a comfy temperature range while mining ETH. If the GPU temperature is 44C
or higher, Turnip decreases the maximum wattage by 10 every 2 minutes until the temperature goes back down. It does the
reverse if the temp is too low.

```json
{
  "sensors": [
    {
      "name": "gpuTemp",
      "driver": "nvidia-gpu-temp",
      "options": {
        "scale": "C"
      }
    }
  ],
  "outputs": [
    {
      "name": "gpuPower",
      "driver": "nvidia-gpu-power",
      "options": {
        "min": 160,
        "max": 230
      }
    }
  ],
  "rules": [
    {
      "threshold": 44,
      "comparison": "gte",
      "interval": "2m",
      "sensor": "gpuTemp",
      "immediate": true,
      "action": {
        "output": "gpuPower",
        "state": "-10"
      },
      "resetWhenNegative": false
    },
    {
      "threshold": 40,
      "comparison": "lte",
      "interval": "2m",
      "sensor": "gpuTemp",
      "immediate": false,
      "action": {
        "output": "gpuPower",
        "state": "+10"
      }
    }
  ]
}
```

## Usage

Turnip starts up in the foreground by default, to make it easier to run as a systemd service. By default it will look for a config file at `$XDG_CONFIG_PATH/turnip/config.json`.
