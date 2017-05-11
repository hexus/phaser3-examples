// TODO: Rename to Deferred Disco.js
var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    // width: 1920,
    // height: 960,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    state: {
        preload: preload,
        create: create,
        update: update
    }
};

var images = [];
var lights = [];
var step = 0;

var albedoPass;
var occlusionPass;
var normalPass;
var lightingPass;

var albedoShader;
var occlusionShader;
var normalShader;
var lightingShader;

var lightPositions = new Float32Array(300);
var lightColors = new Float32Array(400);

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('diamond', 'assets/sprites/diamond.png');
    this.load.image('phaser-dude', 'assets/sprites/phaser-dude.png');
}

function create ()
{
    var i;
    var light;
    var image;
    var width = this.sys.width;
    var height = this.sys.height;
    
    // Prepare some images
    var imageKeys = ['diamond', 'phaser-dude'];
    var imageKeyCount = imageKeys.length;
    
    for (i = 0; i < 200; i++)
    {
        image = this.make.image({
            x: Math.random() * width,
            y: Math.random() * height,
            key: imageKeys[Math.floor(Math.random() * imageKeyCount)],
            add: false
        });
        
        images.push(image);
    }
    
    // Prepare some lights
    for (i = 0; i < 20; i++)
    {
        light = {
            position: {
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * 0.1
            },
            color: {
                r: Math.random(),
                g: Math.random(),
                b: Math.random(),
                a: 2.0
            }
        };
        
        lights.push(light);
    }
    
    // Prepare some render passes
    albedoPass = this.make.renderPass(0, 0, width, height, 'albedo', albedoShader);
    occlusionPass = this.make.renderPass(0, 0, width, height, 'occlusion', occlusionShader);
    normalPass = this.make.renderPass(0, 0, width, height, 'normals', normalShader);
    lightingPass = this.add.effectLayer(0, 0, width, height, 'lighting', lightingShader);
    
    // Prepare the uniforms for each render pass
    light = lights[0];

    //lightingPass.setFloat3('u_light_position', light.position.x, light.position.y, light.position.z);
    lightingPass.setFloat4('u_light_color', light.color.r, light.color.g, light.color.b, light.color.a);
    lightingPass.setFloat4('u_ambient_color', 0.2, 0.2, 0.2, 1.0);
    lightingPass.setFloat4('u_light_falloff', 0.2, 3.0, 1.0, 1.0);

    lightingPass.setRenderTextureAt(albedoPass.renderTexture, 'u_albedo', 1);
    lightingPass.setRenderTextureAt(occlusionPass.renderTexture, 'u_occlusion', 2);
    lightingPass.setRenderTextureAt(normalPass.renderTexture, 'u_normals', 3);
    //lightingPass.setRenderTextureAt(lightsPass.renderTexture, 'u_lights', 4)

    // Use pointer input to control the first light
    game.canvas.onmousemove = function (e) {
        console.log('hihi');
        light.position.x = e.clientX - game.canvas.offsetLeft;
        light.position.y = e.clientY - game.canvas.offsetTop;
    };
}

function update ()
{
    var i;
    var light;
    var camera = this.cameras.main;
    var imageCount = images.length;
    var lightCount = lights.length;
    var width = this.sys.width;
    var height = this.sys.height;

    // Update the image positions
    for (i = 0; i < imageCount; ++i)
    {
        var image = images[i];

        image.x += Math.cos(step + i);
        image.y += Math.sin(step + i);
    }
    
    // Update the light positions
    for (i = 1; i < lightCount; ++i)
    {
        light = lights[i];
        
        light.position.x += Math.cos(step + i);
        light.position.y += Math.sin(step + i);
    }
    
    step += 0.01;
    
    // Render each pass
    albedoPass.clearColorBuffer(0, 0, 0, 0);
    occlusionPass.clearColorBuffer(0, 0, 0, 0);
    normalPass.clearColorBuffer(0, 0, 0, 0);

    for (i = 0; i < imageCount; ++i)
    {
        albedoPass.render(images[i], camera);
    }
    
    for (i = 0; i < imageCount; ++i)
    {
        occlusionPass.render(images[i], camera);
    }
    
    for (i = 0; i < imageCount; ++i)
    {
        normalPass.render(images[i], camera);
    }

    // We render these passes in separate loops to avoid switching shader
    // programs and textures repeatedly. Minimizing such state changes will help
    // to keep WebGL fast.

    // The above passes draw the scene three times. It would be faster to make
    // use of multiple render targets (MRT) to allow a single shader to render
    // the scene to multiple textures in a single pass.

    // WebGL 1 can achieve this with the WEBGL_draw_buffers extension.
    // WebGL 2 will support it natively.

    light = lights[0];
    lightingPass.setFloat3('u_light_position', light.position.x / width, -light.position.y / height + 1, light.position.z);

    // After this, Phaser will take care of rendering the lightingPass for us
    // because it's an effect layer. It will take all the textures we've
    // rendered above and use them to perform lighting calculations.
}

var albedoShader = [
    'precision mediump float;',
    'varying vec2 v_tex_coord;',
    'varying vec3 v_color;',
    'varying float v_alpha;',
    'uniform sampler2D sampler;',
    'void main(void) {',
    '   gl_FragColor = texture2D(sampler, v_tex_coord);',
    '}'
].join('\n');

var occlusionShader = [
    'precision mediump float;',
    'varying vec2 v_tex_coord;',
    'uniform sampler2D u_albedo;',
    'void main(void) {',
    '   gl_FragColor = vec4(texture2D(u_albedo, v_tex_coord).a);',
    '}'
].join('\n');

var normalShader = [
    'precision mediump float;',
    'varying vec2 v_tex_coord;',
    'uniform sampler2D sampler;',
    'void main(void) {',
    '   vec4 color = texture2D(sampler, v_tex_coord);',
    '   gl_FragColor = vec4(v_tex_coord.xy, 1.0, 1.0) * color.a;',
    '}'
].join('\n');

// Ideally, a quad could be rendered for each light that additively produces the
// final lit scene. This would improve performance by reducing overdraw,
// potentially even moreso with instancing and a huge number of lights.
// The quads could in fact be replaced by geometry of any shape as long as they
// cover each light's area of influence.
// var lightShader = [
//     'precision mediump float;',
//     'varying vec2 v_tex_coord;',
//     'uniform sampler2D u_albedo;',
//     'uniform sampler2D u_occlusion;',
//     'uniform sampler2D u_normals;',
//     'uniform float3 u_light_position;',
//     'uniform float3 u_light_color',
//     'void main(void) {',
//     '   vec4 albedo = texture2D(u_albedo, v_tex_coord);',
//     '   vec4 occlusion = texture2D(u_occlusion, v_tex_coord);',
//     '   vec4 normals = texture2D(u_normals, v_tex_coord);',
//     '   vec4 shadow = vec4(0, 0, 0, texture2D(u_occlusion, v_tex_coord * 0.90).a);',
//     '   gl_FragColor = albedo + shadow;',
//     '}'
// ].join('\n');

var lightingShader = [
    'precision mediump float;',
    'varying vec2 v_tex_coord;',
    'varying vec3 v_color;',
    'varying float v_alpha;',
    'uniform sampler2D u_albedo;',
    'uniform sampler2D u_normals;',
    'uniform vec3 u_light_position;',
    'uniform vec4 u_light_color;',
    'uniform vec4 u_ambient_color;',
    'uniform vec4 u_light_falloff;',
    'void main () {',
    '   vec2 uv = vec2(gl_FragCoord.x / 800.0, gl_FragCoord.y / 600.0);',
    '   vec4 color = texture2D(u_albedo, v_tex_coord);',
    '   vec4 normal_map = texture2D(u_normals, v_tex_coord);',
    '   vec3 light_dir = vec3(u_light_position.xy - uv, u_light_position.z);',
    '   light_dir.y *= -1.0;',
    '   float D = length(light_dir);',
    '   vec3 N = normalize(vec3(normal_map.rgb * 2.0 - 1.0));',
    '   vec3 L = normalize(light_dir);',
    '   vec3 diffuse = (u_light_color.rgb * u_light_color.a ) * max(dot(N, L), 0.0);',
    '   vec3 ambient = (u_ambient_color.rgb * u_ambient_color.a);',
    '   float attenuation = 1.0 / (u_light_falloff.x + (u_light_falloff.y * D) + (u_light_falloff.z * D * D* D * D* D * D* D * D* D * D));',
    '   vec3 intensity = ambient + diffuse * attenuation;',
    '   vec3 final_color = color.rgb * intensity;',
    '   gl_FragColor = vec4(final_color, 1.0) * color.a;',
    '}'
].join('\n');

// TODO: Let us set samplers and arrays for Effect Layers! :) This was adapted
//       from the RenderPass source (which also lacks arrays, as improvised).
Phaser.GameObjects.EffectLayer.prototype.setRenderTextureAt = function(renderTexture, samplerName, unit)
{
    var gl = this.dstShader.gl;

    if (gl)
    {
        /* Texture 1 is reserved for Phaser's Main Renderer */
        unit = unit > 0 ? unit : 1;
        this.setInt(samplerName, unit);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, renderTexture.texture);
        gl.activeTexture(gl.TEXTURE0);
    }
};

Phaser.GameObjects.EffectLayer.prototype.setFloat1Array = function(uniformName, value)
{
    var gl = this.dstShader.gl;
    var dstShader = this.dstShader;

    if (gl === null || dstShader === null)
    {
        return;
    }

    gl.useProgram(this.program);
    gl.uniform1fv(this.getUniformLocation(uniformName), value);
};

Phaser.GameObjects.EffectLayer.prototype.setFloat3Array = function (uniformName, value)
{
    var gl = this.dstShader.gl;
    var dstShader = this.dstShader;

    if (gl === null || dstShader === null)
    {
        return;
    }

    gl.useProgram(this.program);
    gl.uniform3fv(this.getUniformLocation(uniformName), value);
};

Phaser.GameObjects.EffectLayer.prototype.setFloat4Array = function (uniformName, value)
{
    var gl = this.dstShader.gl;
    var dstShader = this.dstShader;

    if (gl === null || dstShader === null)
    {
        return;
    }

    gl.useProgram(this.program);
    gl.uniform4fv(this.getUniformLocation(uniformName), value);
};
