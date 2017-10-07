var config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    pixelArt: true,
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.path = 'assets/animations/cybercity/';

    this.load.multiatlas('cybercity', 2);
}

function create ()
{
    this.anims.create({ key: 'fly', frames: this.anims.generateFrameNames('cybercity', { start: 0, end: 98 }), repeat: -1 });

    this.add.sprite().setScale(2.7).play('fly');
}
