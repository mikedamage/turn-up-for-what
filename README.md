# Turn Up for What

Monitor sensors and execute actions based on their readings.

## WHAT

TUFW monitors data sources (sensors), reading values from them at user-defined intervals. It uses rules to decide what
to do based on the readings.

It was initially built with temperature control in mind, but it's flexible enough to be used for any application where
sinple decisions need to be made based on current conditions.

## YEAH

TUFW is configured via a JSON file that has 3 main sections:

+ `sensors`: an object naming and configuring data sources
