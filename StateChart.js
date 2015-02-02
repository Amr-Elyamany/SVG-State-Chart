/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function StateChart(data, panel) {

    this.data = data;
    this.panel = panel;
    this.coordinates = [];
    this.shapes = [];
    this.canvas = null;
    this.dimensions = [];
    this.visited = new Array(this.data.nodeDataArray.length);
    this.curveNumber = 0;
    this.lineNumber = 0;
    this.labelNumber = 0;
    this.circleNumber = 0;
    this.links = new Array(this.data.nodeDataArray.length);
}

StateChart.prototype.init = function() {
    this.canvas = new jsgl.Panel(document.getElementById(this.panel));
    var i = 0;
    for (i = 0; i < this.visited.length; i++)
    {
        this.visited[i] = false;
    }

    var svgNode = document.getElementsByTagName("svg")[0];
    
    svgNode.setAttribute("version","1.1");
    svgNode.setAttribute("baseProfile","full");
    
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'myMarker');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    marker.appendChild(path);
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('id', 'markerpath');
    svgNode.appendChild(defs);
    defs.appendChild(marker);

};

StateChart.prototype.createChart = function() {


    this.init();
    this.createNodes();
    this.createLinks();
    this.initListeners();
    

};

StateChart.prototype.createNodes = function() {


    var i = 0;
    for (i = 0; i < this.data.nodeDataArray.length; i++) {

        this.links[i] = new Array(4);
        
        $('#ruler').html(this.data.nodeDataArray[i].text.substring(0, 10));
        $('#ruler').css("font-family", "sans-serif");
        $("#ruler").css("font-size", "17px");
        var node = this.canvas.createRectangle();
        var backNode = this.canvas.createRectangle();
        
        
        var loc = this.data.nodeDataArray[i].loc.split(" ");
        var x = parseInt(loc[0]);
        var y = parseInt(loc[1]);

        this.coordinates.push(x);
        this.coordinates.push(y);


        width = $('#ruler').width() + 5;
        height = $('#ruler').height() + 10;
        this.dimensions.push([width, height]);

        node.setLocationXY(x, y);
        node.setWidth(width);
        node.setHeight(height);
        node.setRadiiXY(3, 3);
        node.getStroke().setWeight(1.5);
        
        backNode.setLocationXY(x, y);
        backNode.setWidth(width);
        backNode.setHeight(height);
        backNode.setRadiiXY(3, 3);
        backNode.getStroke().setWeight(1.5);
        backNode.setZIndex(-20);

        if (this.data.nodeDataArray[i].visited)
        {
            node.getFill().setColor('#0AF5DD');
        }
        else
        {
            node.getFill().setColor("rgb(254,171,0)");
        }
        node.getFill().setOpacity(0.8);

        this.canvas.addElement(node);
        this.canvas.addElement(backNode);
        this.shapes.push(node);
        

//        label = this.canvas.createLabel();
//        label.setFontSize(18);
//        label.setText(this.data.nodeDataArray[i].text.substring(0, 10));
//        label.setZIndex(-2);
//        label.setHorizontalAnchor(jsgl.HorizontalAnchor.LEFT);
//        label.setVerticalAnchor(jsgl.VerticalAnchor.TOP);
//        label.setLocationXY(x + 5, y);
//        this.canvas.addElement(label);
        this.createLabel(x + 5, y + 5, this.data.nodeDataArray[i].text.substring(0, 10), -1, 15,
                jsgl.HorizontalAnchor.LEFT, jsgl.VerticalAnchor.TOP);

        document.getElementsByTagName("rect")[2*i +1].setAttribute("id", 'tooltip' + i);
        document.getElementsByTagName("rect")[2*i +1].setAttribute("title", this.data.nodeDataArray[i].text);
//        document.getElementsByTagName("circle")[i].setAttribute("class",)
    }

};

StateChart.prototype.createLinks = function() {

    var i = 0;
    for (i = 0; i < this.data.linkDataArray.length; i++)
    {


        var from = this.data.linkDataArray[i].from;
        var to = this.data.linkDataArray[i].to;
        var dim = this.getNearestPoint(from, to);

        var x1 = dim[0];
        var y1 = dim[1];
        var x2 = dim[2];
        var y2 = dim[3];

        var pDim;
        if(this.data.linkDataArray[i].startPos !== null)
        {
            pDim = this.getPositionPoint(from,this.data.linkDataArray[i].startPos);
            dim[0] = pDim[0];
            dim[1] = pDim[1];
        }
        if(this.data.linkDataArray[i].endPos !== null)
        {
            pDim = this.getPositionPoint(to,this.data.linkDataArray[i].endPos);
            dim[2] = pDim[0];
            dim[3] = pDim[1];
        }
        if (from !== to)
        {
            this.visited[from] = true;
            if (("curviness" in this.data.linkDataArray[i]))
            {
                if(y2-y1<=0&&x2-(x1+this.dimensions[from][0])>=0)
                {
                    this.links[from][1]++;
                    this.links[to][0]++;
                }
                else if(y2-y1<=0&&x2+this.dimensions[to][0]-x1<=0)
                {
                    this.links[from][0]++;
                    this.links[to][1]++;
                }
                else if(y2-y1>=0&&x2-(x1+this.dimensions[from][0])>=0)
                {
                    this.links[from][1]++;
                    this.links[to][3]++;
                }
                else if(y2-y1>=0&&x2+this.dimensions[to][0]-x1<=0)
                {
                    this.links[from][0]++;
                    this.links[to][2]++;
                }
                this.createCurve(this.data.linkDataArray[i].text, dim, this.data.linkDataArray[i].curviness,this.data.linkDataArray[i].desc,
                this.data.linkDataArray[i].deltaX,this.data.linkDataArray[i].deltaY);
            }
            else
            {
                var line = this.canvas.createLine();
                line.getStroke().setWeight(1.3);
                line.setStartPointXY(x1, y1);
                line.setEndPointXY(x2, y2);
                line.setZIndex(1);

                this.canvas.addElement(line);
                document.getElementsByTagName("line")[this.lineNumber].setAttribute("marker-end", "url(#myMarker)");
                this.lineNumber++;


//                var label = this.canvas.createLabel();
//                label.setHorizontalAnchor(jsgl.HorizontalAnchor.CENTER);
//                label.setVerticalAnchor(jsgl.VerticalAnchor.MIDDLE);

                slope = (y2 - y1) / (x2 - x1);
                var midY = (y2 + y1) / 2;
                var c = y2 - slope * x2;
                var midX = (midY - c) / slope;
//                label.setLocationXY(midX, midY);
//                label.setText(this.data.linkDataArray[i].text);
//                this.canvas.addElement(label);
                this.createLabel(midX, midY, this.data.linkDataArray[i].text, 0, 12, jsgl.HorizontalAnchor.CENTER, jsgl.VerticalAnchor.MIDDLE);
            }



        }
        else
        {
            this.createSelfLoops(to,this.data.linkDataArray[i].text);
            this.curveNumber++;
//            this.circleNumber++;
        }


    }

};

StateChart.prototype.getPositionPoint = function(node,type)
{
    var x = this.coordinates[node * 2];;
    var y = this.coordinates[node * 2 + 1];
    if(type === "T")
    {
        x = x + this.dimensions[node][0] / 2;
    }
    else if(type === "B")
    {
        x = x + this.dimensions[node][0] / 2;
        y = y + this.dimensions[node][1];
    }
    else if(type === "L")
    {
        y = y + this.dimensions[node][1]/2;
    }
    else if(type === "R")
    {
        x = x + this.dimensions[node][0];
        y = y + this.dimensions[node][1]/2;
    }
    
    var dim = [x,y];
    
    return dim;
};
StateChart.prototype.getNearestPoint = function(from, to)
{
    var x1 = this.coordinates[from * 2];
    var y1 = this.coordinates[from * 2 + 1];
    var x2 = this.coordinates[to * 2];
    var y2 = this.coordinates[to * 2 + 1];
    var dim1 = [[x1, y1 + this.dimensions[from][1] / 2],
        [x1 + this.dimensions[from][0] / 2, y1],
        [x1 + this.dimensions[from][0], y1 + this.dimensions[from][1] / 2],
        [x1 + this.dimensions[from][0] / 2, y1 + this.dimensions[from][1]]];
    var dim2 = [[x2, y2 + this.dimensions[to][1] / 2],
        [x2 + this.dimensions[to][0] / 2, y2],
        [x2 + this.dimensions[to][0], y2 + this.dimensions[to][1] / 2],
        [x2 + this.dimensions[to][0] / 2, y2 + this.dimensions[to][1]]];

    var minDist = 10000;
    var dist = 0;

    var i, j = 0;
    for (i = 0; i < 4; i++)
    {
        for (j = 0; j < 4; j++)
        {
            dist = Math.sqrt((dim1[i][0] - dim2[j][0]) * (dim1[i][0] - dim2[j][0]) +
                    (dim1[i][1] - dim2[j][1]) * (dim1[i][1] - dim2[j][1]));
            if (dist < minDist)
            {
                minDist = dist;
                x1 = dim1[i][0];
                y1 = dim1[i][1];
                x2 = dim2[j][0];
                y2 = dim2[j][1];
            }
        }
    }
    var dim = [x1, y1, x2, y2];
    return dim;

};




StateChart.prototype.createCurve = function(text, dim, curviness,desc,deltaX,deltaY)
{

    var x1 = dim[0];
    var y1 = dim[1];
    var x2 = dim[2];
    var y2 = dim[3];

    var dist = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    var theta = Math.atan((y2 - y1) / (x2 - x1));
    var yMid = 0;
    var xMid = 0;

    var y = 0;
    var x = 0;
    if (x1 < x2)
    {
        yMid = y1 + ((dist / 2) * Math.sin(theta));
        xMid = x1 + ((dist / 2) * Math.sin(Math.PI / 2 - theta));
        y = yMid - (curviness * Math.sin(Math.PI - Math.PI / 2 - theta));
        x = xMid + (curviness * Math.sin(theta));
    }
    else
    {
        yMid = y1 - ((dist / 2) * Math.sin(theta));
        xMid = x1 - ((dist / 2) * Math.sin(Math.PI / 2 - theta));
        y = yMid + (curviness * Math.sin(Math.PI - Math.PI / 2 - theta));
        x = xMid - (curviness * Math.sin(theta));
    }



    var curve = this.canvas.createCurve();
    curve.getStroke().setWeight(2.5);
    curve.getStroke().setColor("rgb(44,44,44)");
    curve.setStartPointXY(x1, y1);
    curve.setEndPointXY(x2, y2);
    curve.setControl1PointXY(x, y);
    curve.setControl2PointXY(x, y);

    this.canvas.addElement(curve);

    var MyPath = document.getElementsByTagName("path")[this.curveNumber];

    if (MyPath.getAttribute('id') !== "markerpath")
    {

        MyPath.setAttribute("id", 'curve' + this.curveNumber);
        len = MyPath.getTotalLength();
//        MySVGPoint = MyPath.
//        tt = ownerDocument.getElementsByTagName('path')[this.curveNumber];
        MyPath_length = MyPath.getTotalLength();
//        MySVGPoint = tt.getPointAtLength(MyPath_length / 2);
        document.writeln(MyPath_length);
        MyPath.setAttribute("marker-end", "url(#myMarker)");
        MyPath.setAttribute("title", desc);
    }
    this.createLabel(x+deltaX, y+deltaY, text, 0, 12, jsgl.HorizontalAnchor.CENTER, jsgl.VerticalAnchor.MIDDLE,"rgb(255,255,255)");
    this.curveNumber++;

//    label = this.canvas.createLabel();
//    label.setHorizontalAnchor(jsgl.HorizontalAnchor.CENTER);
//    label.setVerticalAnchor(jsgl.VerticalAnchor.MIDDLE);
//    label.setLocationXY(x, y);
//    label.setText(text);
//    this.canvas.addElement(label);
};

StateChart.prototype.createSelfLoops = function(to, text)
{
    
    var radius = 20;
    x = this.coordinates[to * 2]  ;//+ this.dimensions[to][0];
    y = this.coordinates[to * 2 + 1]  + this.dimensions[to][1];

    

    var circle = this.canvas.createCircle();
    circle.setCenterLocationXY(x, y);
    circle.setRadius(radius);
    circle.setZIndex(-30);
    circle.getStroke().setWeight(1.5);
    this.canvas.addElement(circle);
    document.getElementsByTagName("circle")[this.circleNumber].setAttribute("marker-mid", "url(#myMarker)");
    this.createLabel(x, y+10, text, 0, 12, jsgl.HorizontalAnchor.CENTER, jsgl.VerticalAnchor.MIDDLE,"rgb(255,255,255)");

//    label = this.canvas.createLabel();
//    label.setHorizontalAnchor(jsgl.HorizontalAnchor.CENTER);
//    label.setVerticalAnchor(jsgl.VerticalAnchor.MIDDLE);
//    label.setLocationXY(x, y - radius);
//    label.setText(text);
//    this.canvas.addElement(label);
};

StateChart.prototype.createLabel = function(x, y, text, zIndex, font, horizontal, vertical,color)
{

    var label = this.canvas.createLabel();

    label.setHorizontalAnchor(horizontal);
    label.setVerticalAnchor(vertical);
    label.setZIndex(zIndex);
    label.setFontSize(font);
    label.setBold(true);
    label.setFontColor(color);
    label.setOpacity(1);

    this.canvas.addElement(label);
    label.setLocationXY(x, y);
    var words = text.split("\n");
    var tag = document.getElementsByTagName("text")[this.labelNumber];

    label.setText(words[0]);

    var i = 1;
    for (i = 1; i < words.length; i++)
    {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//        tspan.setAttribute('text', words[i]);
        tspan.innerHTML = words[i];
        tspan.setAttribute('x', x);
        tspan.setAttribute('dy', 10);
        tag.appendChild(tspan);
    }
    this.labelNumber++;
};

StateChart.prototype.setVisited = function(node)
{
    this.visited[node] = true;
    this.shapes[node].getFill().setColor('#0AF5DD');
};

StateChart.prototype.setTransactionState = function(nodeState)
{

};


StateChart.prototype.initListeners = function() {


    for (i = 0; i < this.data.nodeDataArray.length; i++)
    {
        $("#tooltip" + i).tooltip({
            content: function() {
                return $(this).attr('title');
            },
            show: "slideDown", // show immediately
            open: function(event, ui)
            {
                ui.tooltip.hover(
                        function() {
                            $(this).fadeTo("slow", 0.5);
                        });
            }
        });


    }
    for (i = 0; i <= this.curveNumber; i++)
    {
        $("#curve" + i).tooltip({
            content: function() {
                return $(this).attr('title');
            },
            show: "slideDown", // show immediately
            open: function(event, ui)
            {
                ui.tooltip.hover(
                        function() {
                            $(this).fadeTo("slow", 0.5);
                        });
            }
        });


    }

};
