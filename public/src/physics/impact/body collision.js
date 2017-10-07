var config = {
    type: Phaser.WEBGL,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'impact'
    },
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('block', 'assets/sprites/block.png');
}

function create ()
{
    var blockA = this.physics.add.image(300, 300, 'block');
    var blockB = this.physics.add.image(60, 300, 'block');
    var blockC = this.physics.add.image(730, 300, 'block');

    blockA.setTypeA().setCheckAgainstB().setActive().setMaxVelocity(300);
    blockB.setTypeB().setCheckAgainstA().setFixed();
    blockC.setTypeB().setCheckAgainstA().setFixed();

    blockA.setBounce(1).setVelocityX(300);
}
