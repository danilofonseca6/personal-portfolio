
declare module "*.glsl" {
    const content: string;
    export default content;
}

declare module "*.glsl?raw" {
    const content: string;
    export default content;
}

declare module "*.vert.glsl?raw" {
    const content: string;
    export default content;
}

declare module "*.frag.glsl?raw" {
    const content: string;
    export default content;
}

declare module "*.module.css" {
    const classes: { readonly [key: string]: string };
    export default classes;
}
