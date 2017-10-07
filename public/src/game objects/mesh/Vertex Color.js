var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    backgroundColor: '#000',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var mesh0;
var time = 0;
var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('image0', 'assets/pics/trsipic1-lazur.jpg');
}

function create ()
{
    mesh0 = this.make.mesh({
        key: 'image0',
        x: 400,
        y: 250,
        vertices: [
        /*  X   |   Y  */
        /* ----------- */
            -150, -150,
            -300, 150,
            300, 150,
            150, -150
        ],
        uv: [
        /*  U   |   V  */
        /* ----------- */
            0,      0,
            0,      1,
            1,      1,
            1,      0
        ],
        indices: [0, 1, 2, 0, 2, 3],
        colors: [0x000000, 0xFFFFFF, 0xFFFFFF, 0x000000]
    });
}

function update ()
{   
    var factorX = 20 * 0.1;
    var factorY = 5 * 0.1;

    mesh0.vertices[2] += Math.cos(time) * factorX;
    mesh0.vertices[3] += Math.sin(time) * factorY;
    mesh0.vertices[4] += Math.cos(time) * factorX;
    mesh0.vertices[5] += Math.sin(time) * factorY;

    time += 0.01;
}
