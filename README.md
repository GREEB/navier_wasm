
# threejs_wasm_navier

A 2d navier stoke simulation wasm library stolen from [AkinAguda](https://github.com/AkinAguda/fluid-simulation), extended and documented.
I just added some helper functions to implement it into a game. This has no visualization component even tho you may find an example here on how to do it in threejs.


## Build rust

`wasm-pack build --target web`

## Import

```typescript
import initFluid, { Fluid, FluidConfig } from '../pkg/navier_wasm';
```

## Fluid

### Initiate

TODO: not sure about this, find out how to change/fix this
To make the original repo work i had to add `await initFluid()` before doing anything else.

```Typescript
await initFluid();
```
The fluid simulation takes a grid of max `(u16-2)*(u16-2)` so `251*251`
todo: not 100% sure if max=256 - 4

Theres a helper function in `utils.ts` to not exceed these maxes

```Typescript
const = [height, width] = getDisplayDimensions(h.w)
```

### FluidConfig

Initiate a FluidConfig with a diffusion parameter
```Typescript
const fluidConfig = FluidConfig.new(height, width, df);
```

### New Fluid

 Create fluid with a timestep parameter 
 ```Typescript
 fluid = Fluid.new(fluidConfig, dt);
 ```

### Simulate

In your animation loop add `fluid.simulate()`

### Add density and velocity

This is the simplest form of interacting with the simulation for an example with mouse interaction and more check out the original repo it has `addV` and `addD` fns taking previous mouse positions into account. Just add these to your render loop as well to create continues inflow to the right.

```Typescript
fluid.add_density(fluid.ix(nw/2,hw/2), 100);
fluid.add_velocity(fluid.ix(nw/2,hw/2), 100,0);
```

### Read from simulation

To read from the simulation call 

```Typescript
    let densityValue = fluid.get_density_at_index(index);
    let velocityX = fluid.get_velocity_x(index);
    let velocityY = fluid.get_velocity_y(index);
```
### Visualization

Look at the original repo for a full implementation with multiple shaders. In three js the simplest visualization without GLSL would be to render lines at each cell

This could be done like this:

Install three(examples) folder

`cd three && yarn`

Run it `yarn dev`

There are two files the `sink.ts` includes a shader `pointMaterial` `lineMaterial` and the `line.ts` its like the most minimal example possible.

### ToDo:

- [] Collisions by cell
    - [] Create a middleware to pass scene elements as collisions to the simulation
- [] Fake 3D/Hill solver create hills in 2d could be done by adding a value from 0-1 to an array for the collision 1 is full blocking and 0 is not blocking

#### Defaults

`DEFAULT_TIME_STEP` aka `dt` = `0.5`

`DEFAULT_DIFFUSION` aka `df` = `0.5`

#### Errors

Out of bound errors means you probably asked to create a simulation matrix exceeding u16*u16 = u16 use the helper function `getDisplayDimensions`

## Resources<br>

Real-Time Fluid Dynamics for Games by Jos Stam

Fluid Simulation SIGGRAPH 2007 Course Notes by Robert Bridson and Matthias Muller-Fischer

Gonkee's [video](https://www.youtube.com/watch?v=qsYE1wMEMPA&t)

3Blue1Brown's [video on divergence and curl](https://www.youtube.com/watch?v=rB83DpBJQsE&t)

The Coding Train's [video](https://www.youtube.com/watch?v=alhpH6ECFvQ&t)

# Credit

Full credit to: [AkinAguda](https://github.com/AkinAguda/fluid-simulation)
