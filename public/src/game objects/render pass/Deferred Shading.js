// Deferred Disco.js
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
var normalPass;
var lightingPass;

var albedoShader;
var normalShader;
var lightingShader;

var lightPositions = new Float32Array(300);
var lightColors = new Float32Array(400);

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('diamond', 'assets/sprites/diamond.png');
    this.load.image('phaser-dude', 'assets/sprites/phaser-dude.png');
    this.load.image('phaser', 'assets/sprites/phaser1.png');
}

function create ()
{
    var i;
    var light;
    var image;
    var width = this.sys.width;
    var height = this.sys.height;
    
    // Prepare some images
    var imageKeys = ['diamond', 'phaser-dude', 'phaser'];
    var imageKeyCount = imageKeys.length;
    
    for (i = 0; i < 100; i++)
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
    for (i = 0; i < 10; i++)
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
                a: 1.0
            }
        };
        
        lights.push(light);
    }

    // Prepare some render passes
    albedoPass = this.make.renderPass(0, 0, width, height, 'albedo', albedoShader);
    normalPass = this.make.renderPass(0, 0, width, height, 'normals', normalShader);
    lightingPass = this.add.effectLayer(0, 0, width, height, 'lighting', lightingShader);

    // Prepare the consistent uniforms for the lighting pass
    light = lights[0];

    lightingPass.setFloat2('u_resolution', width, height);
    lightingPass.setFloat4('u_ambient_color', 0.2, 0.2, 0.2, 1.0);
    lightingPass.setFloat4('u_light_falloff', 0.2, 3.0, 1.0, 1.0);
    lightingPass.setRenderTextureAt(albedoPass.renderTexture, 'u_albedo', 1);
    lightingPass.setRenderTextureAt(normalPass.renderTexture, 'u_normals', 3);

    // Use pointer input to control the first light
    game.canvas.onmousemove = function (e) {
        console.log(e);
        light.position.x = e.clientX - game.canvas.offsetLeft;
        light.position.y = e.clientY - game.canvas.offsetTop;
    };

    game.canvas.onmousedown = function (e) {
        for (i = 0; i < lights.length; i++) {
            light = lights[i];
            light.color.r = Math.random();
            light.color.g = Math.random();
            light.color.b = Math.random();
            light.position.z = Math.random() * 0.1;
        }
    };
}

function update ()
{
    var i;
    var light;
    var lightPositionsOffset;
    var lightColorsOffset;
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

    // Update the light positions and uniform arrays
    for (i = 0; i < lightCount; ++i)
    {
        light = lights[i];

        light.position.x += Math.sin(step + i) * 3;
        light.position.y += Math.cos(step + i) * 3;

        lightPositionsOffset = i * 3;
        lightColorsOffset    = i * 4;

        lightPositions[lightPositionsOffset]     = light.position.x / width;
        lightPositions[lightPositionsOffset + 1] = -light.position.y / height + 1;
        lightPositions[lightPositionsOffset + 2] = light.position.z;

        lightColors[lightColorsOffset]     = light.color.r;
        lightColors[lightColorsOffset + 1] = light.color.g;
        lightColors[lightColorsOffset + 3] = light.color.a;
        lightColors[lightColorsOffset + 2] = light.color.b;
    }
    
    step += 0.01;
    
    // Render each pass
    albedoPass.clearColorBuffer(0, 0, 0, 0);
    normalPass.clearColorBuffer(0, 0, 0, 0);

    for (i = 0; i < imageCount; ++i)
    {
        albedoPass.render(images[i], camera);
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

    // WebGL 1 can achieve MRT with the WEBGL_draw_buffers extension.
    // WebGL 2 will support MRT natively.

    // Finally, let's update the uniforms that contain the data for our lights
    light = lights[0];
    lightingPass.setFloat3Array('u_light_position', lightPositions);
    lightingPass.setFloat4Array('u_light_color', lightColors);

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

var normalShader = [
    'precision mediump float;',
    'varying vec2 v_tex_coord;',
    'uniform sampler2D sampler;',
    'void main(void) {',
    '   vec4 color = texture2D(sampler, v_tex_coord);',
    '   gl_FragColor = vec4(v_tex_coord.x, 1.0 - v_tex_coord.y, 1.0, 1.0) * color.a;',
    '}'
].join('\n');

// Ideally, a quad could be rendered for each light that additively produces the
// final lit scene. This would improve performance by reducing overdraw,
// potentially even moreso with instancing and a huge number of lights.
// The quads could in fact be replaced by geometry of any shape as long as they
// cover each light's area of influence.
var lightingShader = [
    'precision mediump float;',
    'const int maxLights = 20;',
    'varying vec2 v_tex_coord;',
    'varying vec3 v_color;',
    'varying float v_alpha;',
    'uniform sampler2D u_albedo;',
    'uniform sampler2D u_normals;',
    'uniform vec2 u_resolution;',
    'uniform vec3 u_light_position[maxLights];',
    'uniform vec4 u_light_color[maxLights];',
    'uniform vec4 u_ambient_color;',
    'uniform vec4 u_light_falloff;',
    'void main () {',
    '   vec2 uv = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y);',
    '   vec4 color = texture2D(u_albedo, v_tex_coord);',
    '   vec4 normal_map = texture2D(u_normals, v_tex_coord);',
    '   vec3 ambient = (u_ambient_color.rgb * u_ambient_color.a);',
    '   vec3 final_intensity;',
    '   for (int i = 0; i < maxLights; i++) {',
    '      vec3 light_dir = vec3(u_light_position[i].xy - uv, u_light_position[i].z);',
    '      float D = length(light_dir);',
    '      vec3 N = normalize(vec3(normal_map.rgb * 2.0 - 1.0));',
    '      vec3 L = normalize(light_dir);',
    '      vec3 diffuse = (u_light_color[i].rgb * u_light_color[i].a ) * max(dot(N, L), 0.0);',
    '      float attenuation = 1.0 / (u_light_falloff.x + (u_light_falloff.y * D) + (u_light_falloff.z * D * D* D * D* D * D* D * D* D * D));',
    '      vec3 intensity = diffuse * attenuation;',
    '      final_intensity += color.rgb * intensity;',
    '   }',
    '   vec3 final_color = ambient * color.rgb + final_intensity;',
    '   gl_FragColor = vec4(final_color, 1.0) * color.a;',
    '}'
].join('\n');

// Let us set samplers and arrays for Effect Layers! :) This was adapted
// from the RenderPass source (which also lacks arrays, as improvised).
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

    gl.useProgram(dstShader.program);
    gl.uniform1fv(this.getUniformLocation(uniformName), value);
};

Phaser.GameObjects.EffectLayer.prototype.setFloat2Array = function(uniformName, value)
{
    var gl = this.dstShader.gl;
    var dstShader = this.dstShader;

    if (gl === null || dstShader === null)
    {
        return;
    }

    gl.useProgram(dstShader.program);
    gl.uniform2fv(this.getUniformLocation(uniformName), value);
};

Phaser.GameObjects.EffectLayer.prototype.setFloat3Array = function (uniformName, value)
{
    var gl = this.dstShader.gl;
    var dstShader = this.dstShader;

    if (gl === null || dstShader === null)
    {
        return;
    }

    gl.useProgram(dstShader.program);
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

    gl.useProgram(dstShader.program);
    gl.uniform4fv(this.getUniformLocation(uniformName), value);
};
