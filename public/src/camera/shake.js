var config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    width: 800,
    height: 600
};

var shakeTime = 0;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('pic', 'assets/pics/a-new-link-to-the-past-by-ptimm.jpg');
}

function create ()
{
    this.add.image(400, 300, 'pic');

    this.input.events.on('MOUSE_DOWN_EVENT', function (event) {

        console.log('shake');

        shakeTime = 1000;

    });

}

function update (time, delta)
{
    if (shakeTime > 0)
    {
        shakeTime -= delta;

        this.cameras.main.shake(1000);
    }
}
