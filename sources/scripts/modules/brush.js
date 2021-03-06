function Brush()
{
  Module.call(this,"brush");

  this.settings = {size:4,color:"#000",opacity:1.0};

  this.pointers = [
    new Pointer({offset:{x:0,y:0}}),
    new Pointer({offset:{x:0,y:0},mirror:{x:400,y:0}})
  ];

  this.ports.speed = new Port(this,"speed",false,true,0,50,"The cursor speed");
  this.ports.distance = new Port(this,"distance",false,true,0,9999,"The cursor distance");
  this.ports.red = new Port(this,"red",true,true,0,255,"The brush color value(red)");
  this.ports.green = new Port(this,"green",true,true,0,255,"The brush color value(green)");
  this.ports.blue = new Port(this,"blue",true,true,0,255,"The brush color value(blue)");

  this.methods.add = new Method("add","x,y&mirror_x,mirror_y","Add a new pointer to the brush",function(q){
    var offset = q.length ? q[0] : q;
    var mirror = q.length ? q[1] : null;
    ronin.brush.pointers.push(new Pointer({offset:offset,mirror:mirror}));
  })

  this.methods.remove = new Method("remove","","Remove last pointer",function(q){
    ronin.brush.pointers.pop();
  })

  this.methods.pick = new Method("pick","x,y","Set brush color to a position's pixel.",function(q){
    var pixel = ronin.render.context().getImageData(q.x*2, q.y*2, 1, 1).data;
    var c = new Color().rgb_to_hex(pixel);
    var color = new Color(c);
    ronin.brush.settings.color = color.hex;
  })

  this.absolute_thickness = 0;

  this.thickness = function(line)
  {
    var t = this.settings.size * this.ports.speed;
    this.absolute_thickness = t > this.absolute_thickness ? this.absolute_thickness+0.5 : this.absolute_thickness-0.5;
    return this.absolute_thickness * 3;
  }

  this.stroke = function(line)
  {
    ronin.commander.blur();

    this.ports.speed = 1-distance_between(line.from,line.to)/15.0;
    this.ports.distance += this.ports.speed;
    // this.ports.noise = Math.random(255/255.0);
    // this.ports.x = line.from.x/2;

    for(pointer_id in this.pointers){
      this.pointers[pointer_id].stroke(line);
    }
  }

  this.erase = function(line)
  {
    var ctx = ronin.render.context();

    ctx.beginPath();
    ctx.globalCompositeOperation="destination-out";
    ctx.moveTo(line.from.x * 2,line.from.y * 2);
    ctx.lineTo(line.to.x * 2,line.to.y * 2);
    ctx.lineCap="round";
    ctx.lineWidth = this.thickness(line);
    ctx.stroke();
    ctx.closePath();
  }

  this.pick = function(line)
  {
    var pixel = ronin.render.context().getImageData(line.to.x*2, line.to.y*2, 1, 1).data;
  }

  this.mod_size = function(mod)
  {
    this.settings.size = clamp(this.settings.size+mod,1,100);
  }

  function clamp(v, min, max)
  { 
    return v < min ? min : v > max ? max : v; 
  }

  function distance_between(a,b)
  {
    return Math.sqrt( (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) );
  }
}

function Pointer(options)
{
  this.options = options;

  this.thickness = function(line)
  {
    return ronin.brush.thickness(line);
  }

  this.color = function(line)
  {
    return ronin.brush.settings.color;
  }

  this.stroke = function(line)
  {
    var ctx = ronin.render.context();

    if(this.options.mirror){
      line.from.x = this.options.mirror.x - line.from.x;
      line.to.x = this.options.mirror.x - line.to.x;  
    }

    ctx.beginPath();
    ctx.globalCompositeOperation="source-over";
    ctx.moveTo((line.from.x * 2) + this.options.offset.x,(line.from.y * 2) + this.options.offset.y);
    ctx.lineTo((line.to.x * 2) + this.options.offset.x,(line.to.y * 2) + this.options.offset.y);
    ctx.lineCap="round";
    ctx.lineWidth = this.thickness(line);
    ctx.strokeStyle = ronin.brush.settings.color;
    ctx.stroke();
    ctx.closePath();
  }

  function clamp(v, min, max)
  { 
    return v < min ? min : v > max ? max : v; 
  }
}