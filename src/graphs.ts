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
type LineDirection = "horizontal" | "vertical";

export type PointConfig = {
    x: number;
    y: number;
    size?: number;
    colour?: string;
    tooltip?: string;
    type?: PointType;
};

export type SerieConfig = Partial<{
    id?: string;
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
    xAxisLabelRotation?: number;
    xAxisLabelSize?: number | string;
    xAxisLabelColour?: string;
};

type GridLineCreateOptions = {
    type: LineDirection;
    colour: string;
    lines: number;
    size: number;
    endX: number;
    startX: number;
    startY: number;
    endY: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

type DrawnDrawable<T extends Drawable<T, U>, U extends SVGElement> = T & { element: UtilSVGElement<U>; };

abstract class Drawable<T extends Drawable<T, U>, U extends SVGElement> {
    element?: UtilSVGElement<T>;

    abstract create(): UtilSVGElement<T>;

    abstract draw(): DrawnDrawable<T, U>;

    abstract sync(): DrawnDrawable<T, U>;
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

export class Point extends Drawable<Point, SVGRectElement | SVGCircleElement> {
    colour = "black";
    size = 1;
    tooltip?: string;
    type: PointType = "circle";
    x = 0;
    y = 0;

    constructor(public graph: LineGraph, config: PointConfig) {
        super();

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

        return this.element = element;
    }

    draw() {
        this.element || this.create();
        return this.sync();
    }

    sync() {
        const { element = this.create(), graph, x, y, middle, size, type } = this;

        const handleMap: {
            circle: (g: LineGraph) => DrawnDrawable<Point, SVGRectElement | SVGCircleElement>;
            rectangle: (g: LineGraph) => DrawnDrawable<Point, SVGRectElement | SVGCircleElement>;
        } = {
            circle: (g) => {
                element.setAttribute("cx", x.toString());
                element.setAttribute("cy", (g.height - y).toString());
                element.setAttribute("r", middle.toString());
                return this as DrawnDrawable<Point, SVGRectElement | SVGCircleElement>;
            },
            rectangle: (g) => {
                element.setAttribute("x", (x - middle).toString());
                element.setAttribute("y", ((g.height - y) - middle).toString());
                element.setAttribute("width", size.toString());
                element.setAttribute("height", size.toString());
                return this as DrawnDrawable<Point, SVGRectElement | SVGCircleElement>;
            },
        };

        return handleMap[type](graph);
    }
}

export class GraphSerie extends List<typeof Point> {
    curved = false;
    colour = "black";
    size = 1;

    element?: UtilSVGElement<SVGGElement>;
    id: string;

    constructor(public graph: LineGraph, config: SerieConfig) {
        const { id, curved = false, size, colour, points } = config;

        super();

        this.curved = curved;
        this.id = id || `serie-${graph.items.length}`;

        if (size) this.size = size;
        if (colour) this.colour = colour;
        if (points) this.pushPoints(...points);
    }

    get numPoints() {
        const { items } = this;
        return items.length;
    }

    pushPoints(...records: PointConfig[]) {
        const { colour: serieColor, graph } = this;

        return this.push(() =>
            records.map((config) => {
                const { colour = serieColor } = config;

                return new Point(graph, {
                    ...config,
                    colour,
                });
            })
        );
    }
    create(): UtilSVGElement<SVGGElement> {
        const { items, size, colour } = this;

        const group = document.createElementNS<SVGGElement>(SVG_NS, "g");

        const path = document.createElementNS(SVG_NS, "path");
        const { style } = path;
        style.fill = "none";
        style.stroke = colour;
        style.strokeWidth = size.toString();

        group.append(path);
        group.append(...items.map((p) => p.create()));
        return this.element = group;
    }

    draw() {
        this.element || this.create();
        this.items.forEach((point) => point.draw());
        return this.sync();
    }

    sync(): GraphSerie & { element: UtilSVGElement<SVGGElement>; } {
        const { element = this.create(), items, graph, curved } = this;

        const { height } = graph;

        const d = items.slice(1).reduce((a, cur, i) => {
            const prev = items[i];

            const endPos = `${cur.x},${height - cur.y}`;

            return `${a} ${curved ? `S ${(cur.x + prev.x) / 2},${height - cur.y},${endPos}` : `L ${endPos}`}`;
        }, `M 0,${height}`);

        element.querySelector("path")?.setAttribute("d", d.trim());

        return this as GraphSerie & { element: UtilSVGElement<SVGGElement>; };
    }
}

export type GraphAxisConfig = {
    makeX?: boolean;
    makeY?: boolean;
    size?: number;
    colour?: string;
    xLabelRotation?: number;
    xLabelSize?: number | string;
    xLabelColour?: string;
};

export type AxisLineConfig = {
    colour?: string;
    type?: LineDirection;
};

export class AxisLine extends Drawable<AxisLine, SVGGElement> {
    colour = "black";
    type: LineDirection = "horizontal";

    constructor(public graph: LineGraph, config: AxisLineConfig) {
        super();

        const { colour, type } = config;

        if (colour) this.colour = colour;
        if (type) this.type = type;
    }

    createPointer() {
        const { colour } = this;
        const pointer = document.createElementNS(SVG_NS, "path");
        pointer.setAttribute("fill", colour);
        return pointer;
    }

    create() {
        const { colour } = this;

        const group = document.createElementNS(SVG_NS, "g");

        const pointer = this.createPointer();

        const line = document.createElementNS(SVG_NS, "line");
        const { style } = line;
        style.stroke = colour;

        group.append(line, pointer);
        return this.element = group;
    }

    draw() {
        this.element || this.create();
        return this.sync();
    }

    sync(): DrawnDrawable<AxisLine, SVGGElement> {
        const { element = this.create(), graph, type } = this;

        const { width, height } = graph;

        const line = element.querySelector("line");
        const pointer = element.querySelector("path");

        if (type === "horizontal") {
            line?.setAttribute("x1", "0");
            line?.setAttribute("x2", width.toString());
            line?.setAttribute("y1", height.toString());
            line?.setAttribute("y2", height.toString());

            pointer?.setAttribute("d", `M ${width - 2} ${height - 2} L ${width} ${height} L ${width - 2} ${height + 2} z`);
        }

        if (type === "vertical") {
            line?.setAttribute("x1", "0");
            line?.setAttribute("x2", "0");
            line?.setAttribute("y1", "0");
            line?.setAttribute("y2", height.toString());

            pointer?.setAttribute("d", "M -2 2 L 0 -2 L 2 2 z");
        }

        return this as DrawnDrawable<AxisLine, SVGGElement>;
    }
}

export type AxisLabelConfig = {
    colour?: string;
    interval?: number;
    labels?: string[];
    rotate?: number;
    size?: number | string;
};

export class AxisLabel extends Drawable<AxisLabel, SVGTextElement> {
    colour = "black";
    interval: number;
    labels: string[] = [];
    rotate = 0;
    size: number | string = 10;

    constructor(public graph: LineGraph, config: AxisLabelConfig = {}) {
        super();

        const {
            colour,
            interval = graph.grid.size,
            labels = [],
            rotate,
            size,
        } = config;

        this.interval = interval;
        this.labels = labels;

        if (colour) this.colour = colour;
        if (rotate) this.rotate = rotate;
        if (size) this.size = size;
    }

    create() {
        const group = document.createElementNS(SVG_NS, "g");
        return this.element = group;
    }

    draw() {
        this.element || this.create();
        return this.sync();
    }

    sync(): DrawnDrawable<AxisLabel, SVGTextElement> {
        const { colour, element = this.create(), labels, interval, graph, rotate, size } = this;

        for (const child of element.children) child.remove();

        const fontSize = typeof size === "number" ? `${size}px` : size;

        const lineSize = 20; // TODO: make configurable

        // TODO: partial updates
        element.append(...labels.map((label, i) => {
            const x = 0 + interval * i;
            const y = graph.height + lineSize;

            const text = document.createElementNS(SVG_NS, "text");
            text.setAttribute("x", (x - interval / 2).toString());
            text.setAttribute("y", y.toString());
            text.setAttribute("font-size", fontSize);
            text.setAttribute("fill", colour);

            if (rotate) {
                text.setAttribute("transform", `rotate(${-rotate},${x},${y})`);
            }

            text.textContent = label;
            return text;
        }));

        return this as DrawnDrawable<AxisLabel, SVGTextElement>;
    }
};

export class GraphAxis extends Drawable<GraphAxis, SVGGElement> {
    makeX = true;
    makeY = true;
    size = 1;

    xLine: AxisLine;
    yLine: AxisLine;

    xLabel: AxisLabel;

    constructor(public graph: LineGraph, config: GraphAxisConfig) {
        super();

        const {
            makeX = true,
            makeY = true,
            size = 1,
            colour = "black",
            xLabelRotation = 0,
            xLabelSize = 10,
            xLabelColour,
        } = config;

        this.makeX = makeX;
        this.makeY = makeY;
        this.size = size;

        this.xLine = new AxisLine(graph, { type: "horizontal", colour });
        this.yLine = new AxisLine(graph, { type: "vertical", colour });
        this.xLabel = new AxisLabel(graph, {
            colour: xLabelColour || colour,
            rotate: xLabelRotation,
            size: xLabelSize
        });
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

    createMark() {
        // const line = document.createElementNS<SVGLineElement>(SVG_NS, "line");
    }

    createMarks(_size: number) {
        const { graph, numXmarks, numYmarks } = this;
        if (!graph) return;

        for (let i = 1; i <= numXmarks; i++) {}

        for (let i = 1; i <= numYmarks; i++) {}
    }

    create() {
        const { size, xLabel, xLine, yLine } = this;

        this.createMarks(size); //marks should come first to be overlayed by the axis

        const element = document.createElementNS<SVGGElement>(SVG_NS, "g");

        element.append(xLine.create(), yLine.create(), xLabel.create());

        return this.element = element;
    }

    draw() {
        this.element || this.create();

        const { makeX, makeY, xLine, yLine, xLabel } = this;

        if (makeX) {
            xLabel.draw();
            xLine.draw();
        }

        if (makeY) {
            yLine.draw();
        }

        return this.sync();
    }

    sync(): DrawnDrawable<GraphAxis, SVGGElement> {
        // TODO: sync markers and pointers
        return this as DrawnDrawable<GraphAxis, SVGGElement>;
    }
}

export type GraphGridConfig = {
    colour?: string;
    horizontal?: boolean;
    size?: number;
    vertical?: boolean;
};

export class GraphGrid extends Drawable<GraphGrid, SVGGElement> {
    horizontal: boolean;
    vertical: boolean;

    colour = "black";
    size = 1;

    xLines: SVGLineElement[] = [];
    yLines: SVGLineElement[] = [];

    constructor(public graph: LineGraph, config: GraphGridConfig) {
        super();

        const { colour, size, horizontal = false, vertical = false } = config;

        this.horizontal = horizontal;
        this.vertical = vertical;

        if (size) this.size = size;
        if (colour) this.colour = colour;
    }

    get numXcells() {
        const { size, graph } = this;
        return Math.ceil(graph.width / size);
    }

    get numYcells() {
        const { size, graph } = this;
        return Math.ceil(graph.height / size);
    }

    createLines({
        type,
        size,
        colour,
        lines,
        startX,
        startY,
        endX,
        endY,
    }: GridLineCreateOptions) {
        const temp: SVGLineElement[] = [];
        for (let i = 1; i < lines; i++) {
            const offset = (size * i);

            const line = document.createElementNS(SVG_NS, "line");
            const { style } = line;
            style.stroke = colour;
            style.strokeWidth = "0.5";

            if (type === "vertical") {
                line.setAttribute("x1", startX.toString());
                line.setAttribute("x2", endX.toString());
                line.setAttribute("y1", (startY - offset).toString());
                line.setAttribute("y2", (startY - offset).toString());
            }

            if (type === "horizontal") {
                line.setAttribute("x1", (startX + offset).toString());
                line.setAttribute("x2", (startX + offset).toString());
                line.setAttribute("y1", startY.toString());
                line.setAttribute("y2", endY.toString());
            }

            temp.push(line);
        }

        return temp;
    }

    create(): UtilSVGElement<SVGGElement> {
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

        const { height, width } = graph;

        const common = {
            colour,
            size,
            startX: 2,
            endX: width - 2,
            startY: height,
            endY: 0,
        };

        if (horizontal) {
            xLines.push(
                ...this.createLines({
                    ...common,
                    lines: numXcells,
                    type: "horizontal",
                })
            );
        }

        if (vertical) {
            yLines.push(
                ...this.createLines({
                    ...common,
                    lines: numYcells,
                    type: "vertical",
                })
            );
        }

        const group = document.createElementNS<SVGGElement>(SVG_NS, "g");
        group.append(...xLines, ...yLines);
        return this.element = group;
    }

    draw() {
        this.element || this.create();
        return this.sync();
    }

    sync(): DrawnDrawable<GraphGrid, SVGGElement> {
        const { xLines, yLines } = this;

        //TODO: move and recolour instead of redraw
        xLines.forEach((line) => line.remove());
        yLines.forEach((line) => line.remove());
        xLines.length = 0;
        yLines.length = 0;
        this.create();

        return this as DrawnDrawable<GraphGrid, SVGGElement>;
    }
}

export class LineGraph extends List<typeof GraphSerie> {
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
        xAxisLabelRotation = 0,
        xAxisLabelSize = 10,
        xAxisLabelColour,
    }: GraphConfig) {
        super();

        this.id = id;
        this.size = size;
        this.width = width;
        this.height = height;

        this.grid = new GraphGrid(this, {
            colour: gridColour,
            horizontal: xAxisGridLines,
            vertical: yAxisGridLines,
            size: gridSize
        });

        this.axis = new GraphAxis(this, {
            size,
            colour: axisColour,
            xLabelRotation: xAxisLabelRotation,
            xLabelSize: xAxisLabelSize,
            xLabelColour: xAxisLabelColour,
        });
    }

    pushSeries(...records: SerieConfig[]) {
        const { size } = this;

        return this.push(() =>
            records.map(({ points = [], ...rest }) => {
                const serie = new GraphSerie(this, { size, ...rest });
                serie.pushPoints(...points);
                return serie;
            })
        );
    }

    setXaxisLabels(interval: number, labels: string[]) {
        const { axis: { xLabel } } = this;
        xLabel.labels.length = 0;
        xLabel.labels.push(...labels);
        xLabel.interval = interval;
    }

    clean() {
        const { element } = this;
        if (!element) return;
        while (element.firstChild) element.lastChild?.remove();
    }

    create(): UtilSVGElement<SVGSVGElement> {
        const { id } = this;

        const element = document.createElementNS<SVGSVGElement>(SVG_NS, "svg");
        element.setAttribute("id", id);

        return this.element = element;
    }

    draw(): DrawnDrawable<LineGraph, SVGSVGElement> {
        const { grid, axis, items, element = this.create() } = this;

        this.clean(); //tabula rasa

        element.append(axis.draw().element);
        element.append(grid.draw().element);

        const series = items.map((serie) => serie.draw().element);
        element.append(...series);

        return this.sync();
    }

    sync(): DrawnDrawable<LineGraph, SVGSVGElement> {
        const { width, height, element = this.create() } = this;
        element.setAttribute("width", width.toString());
        element.setAttribute("height", height.toString());
        element.setAttribute("viewBox", `-2 -2 ${width + 2} ${height + 4 + 30}`); // TODO: 30 is label line size
        return this as DrawnDrawable<LineGraph, SVGSVGElement>;
    }
}
