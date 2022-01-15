type Constr = new (...args: any[]) => any;

type UtilSVGElement<T> = SVGElement & {
    setAttribute(key: keyof T, val: string): void;
};

declare global {
    interface Document {
        createElementNS<T>(
            namespaceURI: "http://www.w3.org/2000/svg",
            qualifiedName: string
        ): UtilSVGElement<T>;
    }

    interface Node {
        cloneNode<T extends Node>(deep?: boolean): T;
    }
}

type PointType = "circle" | "rectangle";
type LineType = "straight" | "curved";

type PointConfig = {
    x: number;
    y: number;
    size?: number;
    colour?: string;
    type?: PointType;
};

type SerieConfig = Partial<{
    points: PointConfig[];
    curved: boolean;
    colour: string;
    size: number;
}>;

type GraphConfig = {
    id: string;
    width: number;
    height: number;
    size?: number;
    gridColour?: string;
    gridSize?: number;
    axisColour?: string;
};

type GridLineCreateOptions = {
    type: "horizontal" | "vertical";
    colour: string;
    lines: number;
    size: number;
    end: number;
    start?: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export class Point {
    colour = "black";
    type: PointType = "circle";

    element?: UtilSVGElement<SVGRectElement | SVGCircleElement>;

    constructor(public x: number, public y: number, public size = 1) {}

    get middle() {
        const { size } = this;
        return size / 2;
    }

    move(x: number, y: number) {
        this.x += x;
        this.y += y;
        this.sync();
    }

    create() {
        const { colour, type } = this;

        const handleMap: {
            circle: () => UtilSVGElement<SVGCircleElement>;
            rectangle: () => UtilSVGElement<SVGRectElement>;
        } = {
            circle: () =>
                document.createElementNS<SVGCircleElement>(SVG_NS, type),
            rectangle: () =>
                document.createElementNS<SVGRectElement>(SVG_NS, "rect"),
        };

        const element = handleMap[type]();
        const { style } = element;
        style.fill = colour;

        this.element = element;

        this.sync();

        return element;
    }

    draw() {
        const { element = this.create() } = this;
        return element;
    }

    sync() {
        const { element, x, y, middle, size, type } = this;
        if (!element) return;

        const handleMap: {
            circle: () => UtilSVGElement<SVGCircleElement>;
            rectangle: () => UtilSVGElement<SVGRectElement>;
        } = {
            circle: () => {
                element.setAttribute("cx", x.toString());
                element.setAttribute("cy", y.toString());
                element.setAttribute("r", middle.toString());
                return element;
            },
            rectangle: () => {
                element.setAttribute("x", (x - middle).toString());
                element.setAttribute("y", (y - middle).toString());
                element.setAttribute("width", size.toString());
                element.setAttribute("height", size.toString());
                return element;
            },
        };

        return handleMap[type]();
    }
}

export class GraphLine {
    colour = "black";
    type: LineType = "straight";

    element?: UtilSVGElement<SVGLineElement>;

    constructor(public start: Point, public end: Point, public stroke = 1) {}

    create() {
        const { colour, stroke } = this;

        const line = document.createElementNS<SVGLineElement>(SVG_NS, "line");

        const { style } = line;
        style.strokeWidth = stroke.toString();
        style.stroke = colour;

        this.element = line;

        this.sync();

        return line;
    }

    draw() {
        const { element = this.create() } = this;
        return element;
    }

    resize() {
        const { start, end } = this;
        start.sync();
        end.sync();
        this.sync();
    }

    sync() {
        const {
            start: { x: sx, y: sy },
            end: { x: ex, y: ey },
            element,
        } = this;
        if (!element) return;

        element.setAttribute("x1", sx.toString());
        element.setAttribute("y1", sy.toString());

        element.setAttribute("x2", ex.toString());
        element.setAttribute("y2", ey.toString());
    }
}

abstract class List<T extends Constr> {
    items: InstanceType<T>[] = [];

    protected push(callback: () => InstanceType<T>[]) {
        const { items } = this;
        items.push(...callback());
        return items;
    }

    protected pop(num: number) {
        const { items } = this;
        return items.splice(items.length - num, num);
    }
}

export class Serie extends List<typeof Point> {
    curved: boolean;
    colour = "black";
    size = 1;

    lines: GraphLine[] = [];

    graph?: LineGraph;

    constructor({ curved = false, size, colour }: Omit<SerieConfig, "points">) {
        super();

        this.curved = curved;

        if (size) this.size = size;
        if (colour) this.colour = colour;
    }

    pushPoints(...records: PointConfig[]) {
        const { colour: serieColor } = this;

        return this.push(() =>
            records.map(({ x, y, size = 1, colour, type }) => {
                const point = new Point(x, y, size);
                point.colour = colour || serieColor;
                if (type) point.type = type;
                return point;
            })
        );
    }
    create() {
        const { items, size = 1, colour, curved } = this;

        const type: LineType = curved ? "curved" : "straight";

        const lines = items.map((startPoint, idx) => {
            const endPoint = items[idx + 1];
            const line = new GraphLine(
                startPoint,
                endPoint || startPoint,
                size
            );
            if (colour) line.colour = colour;
            if (curved) line.type === type;
            return line;
        });

        this.lines = lines;

        return lines;
    }

    draw(): (SVGLineElement | SVGElement)[] {
        const { items } = this;

        const lines = this.create();

        const drawnPoints = items.map((point) => point.draw());
        const drawnLines = lines.map((line) => line.draw());
        return [...drawnLines, ...drawnPoints];
    }

    resize(newSize: number) {
        const { lines, size: oldSize, items } = this;

        const mod = newSize / oldSize;

        items.forEach((point) => {
            point.x *= mod;
            point.y *= mod;
        });

        lines.forEach((line) => line.resize());

        this.size = newSize;
    }
}

type GraphAxisConfig = {
    makeX?: boolean;
    makeY?: boolean;
    size?: number;
    colour?: string;
};

type MarkerAngle = "auto" | "auto-start-reverse" | number;

export class GraphAxis {
    makeX = true;
    makeY = true;
    size = 1;
    colour = "black";

    element?: UtilSVGElement<SVGGElement>;

    graph?: LineGraph;

    constructor({
        makeX = true,
        makeY = true,
        size = 1,
        colour = "black",
    }: GraphAxisConfig) {
        this.makeX = makeX;
        this.makeY = makeY;
        this.size = size;
        this.colour = colour;
    }

    get numXmarks() {
        const { graph, makeX, size } = this;
        if (!graph || !makeX) return 0;
        const { width } = graph;
        return Math.ceil(width / size) - 2; //0 and end don't count
    }
    get numYmarks() {
        const { graph, makeX, size } = this;
        if (!graph || !makeX) return 0;
        const { height } = graph;
        return Math.ceil(height / size) - 2; //0 and end don't count
    }

    createPointer(
        xPos: number,
        yPos: number,
        orientation: MarkerAngle = "auto"
    ) {
        const { colour } = this;
        const marker = document.createElementNS<SVGMarkerElement>(
            SVG_NS,
            "marker"
        );
        marker.setAttribute("refX", xPos.toString());
        marker.setAttribute("refY", yPos.toString());
        marker.setAttribute("orient", orientation.toString());
        const { style } = marker;
        style.color = colour;
        return marker;
    }

    createMark() {
        // const line = document.createElementNS<SVGLineElement>(SVG_NS, "line");
    }

    createMarks(_size: number) {
        const { graph, numXmarks, numYmarks } = this;
        if (!graph) return;

        for (let i = 1; i <= numXmarks; i++) {}

        for (let i = 1; i <= numYmarks; i++) {}
    }

    createAxis(sx: number, sy: number, ex: number, ey: number) {
        const line = document.createElementNS<SVGLineElement>(SVG_NS, "line");
        line.setAttribute("x1", sx.toString());
        line.setAttribute("x2", ex.toString());
        line.setAttribute("y1", sy.toString());
        line.setAttribute("y2", ey.toString());
        return line;
    }

    create() {
        const { makeX, makeY, size, graph, element, colour } = this;

        this.createMarks(size); //marks should come first to be overlayed by the axis

        const plane =
            element || document.createElementNS<SVGGElement>(SVG_NS, "g");
        const { style } = plane;
        style.stroke = colour;

        if (!graph) return plane;

        const { width, height } = graph;

        if (makeX) plane.append(this.createAxis(0, height, width, height));
        if (makeY) plane.append(this.createAxis(0, height, width, 0));

        return plane;
    }

    draw() {
        const { element = this.create() } = this;
        return (this.element = element);
    }

    sync() {
        // const { xAxis, yAxis } = this;
    }
}

export class GraphGrid {
    horizontal = true;
    vertical = true;

    colour = "black";

    xLines: SVGLineElement[] = [];
    yLines: SVGLineElement[] = [];

    graph?: LineGraph;

    constructor(public width: number, public height: number, public size = 1) {}

    get numXcells() {
        const { size, width } = this;
        return Math.ceil(width / size);
    }

    get numYcells() {
        const { size, height } = this;
        return Math.ceil(height / size);
    }

    createLines({
        type,
        size,
        colour,
        lines,
        end,
        start = 0,
    }: GridLineCreateOptions) {
        const masterLine = document.createElementNS(SVG_NS, "line");
        const { style: ystyle } = masterLine;
        ystyle.stroke = colour;

        const isHor = type === "horizontal";

        const sxAttr = isHor ? "x1" : "y1";
        const syAttr = isHor ? "y1" : "x1";
        const exAttr = isHor ? "x2" : "y2";
        const eyAttr = isHor ? "y2" : "x2";

        const temp: SVGLineElement[] = [];
        for (let i = 0; i < lines; i++) {
            const pos = (size * i).toString();

            const line = masterLine.cloneNode<SVGLineElement>();
            line.setAttribute(sxAttr, pos);
            line.setAttribute(exAttr, pos);
            line.setAttribute(syAttr, start.toString());
            line.setAttribute(eyAttr, end.toString());

            temp.push(line);
        }

        return temp;
    }

    create() {
        const {
            colour,
            numXcells,
            numYcells,
            size,
            graph,
            xLines,
            yLines,
            horizontal,
            vertical,
        } = this;

        if (!graph) return;

        const { height, width } = graph;

        const common = { colour, size };

        if (horizontal) {
            xLines.push(
                ...this.createLines({
                    ...common,
                    type: "horizontal",
                    end: height,
                    lines: numXcells,
                })
            );
        }

        if (vertical) {
            yLines.push(
                ...this.createLines({
                    ...common,
                    type: "vertical",
                    end: width,
                    lines: numYcells,
                })
            );
        }

        //TODO: decide if we need element wrapper
        return;
    }

    draw() {
        const { xLines, yLines, graph } = this;

        if (!graph || !graph.element) return;

        if (!xLines.length && !yLines.length) this.create();

        const { element } = graph;

        element.prepend(...xLines, ...yLines);
    }

    sync() {
        const { xLines, yLines } = this;

        //TODO: move and recolour instead of redraw

        xLines.forEach((line) => line.remove());
        yLines.forEach((line) => line.remove());
        xLines.length = 0;
        yLines.length = 0;

        return this.draw();
    }
}

export class LineGraph extends List<typeof Serie> {
    element?: UtilSVGElement<SVGSVGElement>;
    grid: GraphGrid;
    axis: GraphAxis;

    id: string;
    size: number;
    width: number;
    height: number;

    constructor({
        id,
        width,
        height,
        size = 1,
        axisColour = "black",
        gridColour = "lightgrey",
        gridSize = 2,
    }: GraphConfig) {
        super();

        this.id = id;
        this.size = size;
        this.width = width;
        this.height = height;

        const grid = new GraphGrid(width, height, gridSize);
        grid.colour = gridColour;
        grid.graph = this;
        this.grid = grid;

        this.axis = new GraphAxis({ size, colour: axisColour });
    }

    pushSeries(...records: SerieConfig[]) {
        const { size } = this;

        return this.push(() =>
            records.map(({ points = [], ...rest }) => {
                const serie = new Serie({ size, ...rest });
                serie.pushPoints(...points);
                serie.graph = this;
                return serie;
            })
        );
    }

    clean() {
        const { element } = this;
        if (!element) return;
        while (element.firstChild) element.lastChild?.remove();
    }

    create() {
        const { width, height, id } = this;

        const element = document.createElementNS<SVGSVGElement>(SVG_NS, "svg");
        element.setAttribute("width", width.toString());
        element.setAttribute("height", height.toString());
        element.setAttribute("id", id);

        return (this.element = element);
    }

    draw() {
        const { grid, axis, items, element = this.create() } = this;

        this.clean(); //tabula rasa

        const drawnAxis = axis.draw(); //draw grid axis first for axis lines to cover grid;
        element.append(drawnAxis);

        grid.draw(); //draw grid second for points to be on top of grid;

        const series = items.flatMap((serie) => serie.draw());
        element.append(...series);

        return element;
    }

    resize(size: number) {
        const { items } = this;
        items.forEach((serie) => serie.resize(size));
        this.size = size;
    }

    sync() {
        const { grid } = this;

        grid.sync(); //TODO: sync more than just grid colour
    }
}

export const testGraph = () => {
    const rndByte = () => Math.floor(Math.random() * 255);

    const rndColor = () => `rgb(${rndByte()}, ${rndByte()}, ${rndByte()})`;

    const graph = new LineGraph({
        id: "grid_test",
        height: 400,
        width: 400,
        gridColour: rndColor(),
        gridSize: 4,
    });

    const getRandomSeries = (): SerieConfig => {
        const points: PointConfig[] = [];
        for (let i = 0; i < 50; i += 2) {
            points.push({
                x: i * 2,
                y: Math.floor(Math.random() * 75),
                size: 4,
                colour: rndColor(),
                type: Math.random() > 0.5 ? "circle" : "rectangle",
            });
        }
        return {
            points,
            colour: rndColor(),
            curved: Math.random() > 0.5,
        };
    };

    graph.pushSeries(getRandomSeries(), getRandomSeries(), getRandomSeries());

    const element = graph.draw();

    document.body.append(element);

    graph.element!.style.position = "absolute";
    graph.element!.style.left = "45px";
    graph.element!.style.top = "45px";
    graph.element!.style.backgroundColor = "white";

    let flipper = 0;
    setInterval(() => {
        graph.resize(flipper ? 1 : 4);
        flipper = ~flipper;

        const { grid } = graph;
        grid.colour = rndColor();
        grid.size = Math.random() * 16 + 4;
        grid.horizontal = Math.random() > 0.5;
        grid.vertical = Math.random() > 0.5;
        graph.sync();
    }, 4e3);

    //@ts-expect-error
    window.GRAPH = graph;
};