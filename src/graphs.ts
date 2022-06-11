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
type GridLineType = "horizontal" | "vertical";

export type PointConfig = {
    x: number;
    y: number;
    size?: number;
    colour?: string;
    tooltip?: string;
    type?: PointType;
};

export type SerieConfig = Partial<{
    points: PointConfig[];
    curved: boolean;
    colour: string;
    size: number;
}>;

export type GraphConfig = {
    id: string;
    width: number;
    height: number;
    size?: number;
    gridColour?: string;
    gridSize?: number;
    axisColour?: string;
    xAxisGridLines?: boolean;
    yAxisGridLines?: boolean;
};

type GridLineCreateOptions = {
    type: GridLineType;
    colour: string;
    lines: number;
    size: number;
    end: number;
    start?: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export class Point {
    colour = "black";
    size = 1;
    tooltip?: string;
    type: PointType = "circle";
    x = 0;
    y = 0;

    element?: UtilSVGElement<SVGRectElement | SVGCircleElement>;

    constructor(config: PointConfig) {
        const { x, y, colour, size, tooltip, type } = config;
        this.x = x;
        this.y = y;

        if (colour) this.colour = colour;
        if (size) this.size = size;
        if (tooltip) this.tooltip = tooltip;
        if (type) this.type = type;
    }

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
        const { colour, tooltip, type } = this;

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

        if (tooltip) {
            const title = document.createElementNS<SVGTitleElement>(SVG_NS, "title");
            title.textContent = tooltip;
            element.append(title);
        }

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
    curved = false;
    colour = "black";
    size = 1;

    lines: GraphLine[] = [];

    constructor(public graph: LineGraph, config: SerieConfig) {
        const { curved = false, size, colour, points } = config;

        super();

        this.curved = curved;

        if (size) this.size = size;
        if (colour) this.colour = colour;
        if (points) this.pushPoints(...points);
    }

    get numLines() {
        const { lines } = this;
        return lines.length;
    }

    get numPoints() {
        const { items } = this;
        return items.length;
    }

    pushPoints(...records: PointConfig[]) {
        const { colour: serieColor, graph } = this;

        const { height } = graph;

        return this.push(() =>
            records.map((config) => {
                const { y, colour = serieColor } = config;

                return new Point({
                    ...config,
                    y: height - y,
                    colour,
                });
            })
        );
    }
    create() {
        const { items, size, colour, curved } = this;

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

    constructor(public graph: LineGraph, public width: number, public height: number, public size = 1) { }

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
        xAxisGridLines = true,
        yAxisGridLines = true,
    }: GraphConfig) {
        super();

        this.id = id;
        this.size = size;
        this.width = width;
        this.height = height;

        const grid = new GraphGrid(this, width, height, gridSize);
        grid.colour = gridColour;
        grid.horizontal = xAxisGridLines;
        grid.vertical = yAxisGridLines;
        this.grid = grid;

        this.axis = new GraphAxis({ size, colour: axisColour });
    }

    pushSeries(...records: SerieConfig[]) {
        const { size } = this;

        return this.push(() =>
            records.map(({ points = [], ...rest }) => {
                const serie = new Serie(this, { size, ...rest });
                serie.pushPoints(...points);
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
