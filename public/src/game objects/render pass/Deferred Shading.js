var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
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
var lightPass;
var compositeLayer;

var positionShader;
var albedoShader;
var occlusionShader;
var normalShader;
var lightShader;
var compositeShader;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('diamond', 'assets/sprites/diamond.png');
    this.load.image('phaser-dude', 'assets/sprites/phaser-dude.png');
}

function create ()
{
    var width = this.sys.width;
    var height = this.sys.height;
    
    // Prepare some images
    var imageKeys = ['diamond', 'phaser-dude'];
    var imageKeyCount = imageKeys.length;
    
    for (var i = 0; i < 100; i++)
    {
        var image = this.make.image({
            x: Math.random() * width,
            y: Math.random() * height,
            key: imageKeys[Math.floor(Math.random() * imageKeyCount)],
            add: false
        });
        
        images.push(image);
    }
    
    // Prepare some render passes
    albedoPass = this.make.renderPass(0, 0, width, height, 'albedo', albedoShader);
    occlusionPass = this.make.renderPass(0, 0, width, height, 'occlusion', occlusionShader);
    normalPass = this.make.renderPass(0, 0, width, height, 'normals', normalShader);
    // lightsPass = this.make.renderPass(0, 0, width, height, 'lights', lightShader);
    compositeLayer = this.add.effectLayer(0, 0, width, height, 'composite', compositeShader);
    
    // Prepare the consistent uniforms for each render pass
    compositeLayer.setRenderTextureAt(albedoPass.renderTexture, 'u_albedo', 1);
    compositeLayer.setRenderTextureAt(occlusionPass.renderTexture, 'u_occlusion', 2);
    compositeLayer.setRenderTextureAt(normalPass.renderTexture, 'u_normals', 3);
    //compositeLayer.setRenderTextureAt(lightsPass.renderTexture, 'u_lights', 4)
}

function update ()
{
    var i;
    var camera = this.cameras.main;
    var imageCount = images.length;
    var lightCount = lights.length;

    // Update the image positions
    for (i = 0; i < imageCount; ++i)
    {
        var image = images[i];

        image.x += Math.cos(step + i);
        image.y += Math.sin(step + i);
    }
    
    // Update the light positions
    for (i = 0; i < lightCount; ++i)
    {
        var light = lights[i];
        
        light.x += Math.cos(step + i);
        light.y += Math.sin(step + i);
    }
    
    step += 0.01;
    
    // Render each pass
    albedoPass.clearColorBuffer(0, 0, 0, 0);
    occlusionPass.clearColorBuffer(0, 0, 0, 0);
    normalPass.clearColorBuffer(0, 0, 0, 0);
    //lightsPass.clearColorBuffer(0, 0, 0, 0);

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

    // We do this in separate loops to avoid switching shader program for each
    // pass. Minimizing such state changes will keep WebGL fast.

    // The above passes draw the scene three times. It would be faster to make
    // use of multiple render targets (MRT) to allow a single shader to render
    // the scene to multiple textures in a single pass.

    // WebGL 1 can achieve this with the WEBGL_draw_buffers extension.
    // WebGL 2 will support it natively.

    // After this, Phaser will take care of rendering the compositeLayer for us,
    // which takes all the textures we've rendered above and combines them.
}

var albedoShader = [
    'precision mediump float;',
    'uniform sampler2D sampler;',
    'varying vec2 v_tex_coord;',
    'void main(void) {',
    '   gl_FragColor = texture2D(sampler, v_tex_coord);',
    '}'
].join('\n');

var occlusionShader = [
    'precision mediump float;',
    'uniform sampler2D sampler;',
    'uniform sampler2D u_albedo;',
    'varying vec2 v_tex_coord;',
    'void main(void) {',
    '   gl_FragColor = vec4(texture2D(u_albedo, v_tex_coord).a);',
    '}'
].join('\n');

var normalShader = [
    'precision mediump float;',
    'uniform sampler2D sampler;',
    'varying vec2 v_tex_coord;',
    'varying vec3 v_color;',
    'varying float v_alpha;',
    'void main(void) {',
    '   vec4 color = texture2D(sampler, v_tex_coord);',
    '   gl_FragColor = vec4(v_tex_coord.xy, 1.0, 1.0) * color.a;',
    '}'
].join('\n');

var compositeShader = [
    'precision mediump float;',
    'uniform sampler2D sampler;',
    'uniform sampler2D u_albedo;',
    'uniform sampler2D u_occlusion;',
    'uniform sampler2D u_normals;',
    'varying vec2 v_tex_coord;',
    'void main(void) {',
    '   gl_FragColor = texture2D(u_normals, v_tex_coord);',
    '}'
].join('\n');

// TODO: Let us set samplers for Effect Layers! :) This was adapted from the
//       RenderPass source.
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
