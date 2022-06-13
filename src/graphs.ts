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
    id?: string;
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

const SVG_NS = "http://www.w3.org/2000/svg";

type DrawnDrawable<T extends Drawable<T, U>, U extends SVGElement> = T & { element: UtilSVGElement<U>; };

abstract class Drawable<T extends Drawable<T, U>, U extends SVGElement> {
    element?: UtilSVGElement<T>;

    abstract create(): UtilSVGElement<T>;

    destroy(): T {
        this.element?.remove();
        return this as unknown as T;
    }

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
    id: string;
    size = 1;
    tooltip?: string;
    type: PointType = "circle";
    y: number;

    constructor(public graph: LineGraph, public serie: GraphSerie, config: PointConfig) {
        super();

        const { y, colour, size, tooltip, type, id } = config;

        const { numPoints } = serie;

        this.id = id || `${serie.id}-point-${numPoints}-${Date.now()}`;
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

    get x() {
        const { graph, serie, id } = this;
        return graph.pointXshift * serie.indexOf(id);
    }

    create() {
        const { colour, id, tooltip, type } = this;

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
        element.id = id;

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
        const { element = this.create(), serie } = this;
        if (!element.isConnected) serie.element?.append(element);
        return this.sync();
    }

    sync() {
        const { element = this.create(), graph, x, y, middle, size, type, tooltip } = this;

        if (tooltip) {
            const title = element.querySelector("title");
            if (title) title.textContent = tooltip;
        }

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

    /**
     * @summary gets last {@link Point} in the serie
     */
    get lastPoint(): Point | undefined {
        const { numPoints } = this;
        return this.pointAt(numPoints - 1);
    }

    /**
     * @summary gets an index of a {@link Point}
     * @param id {@link Point.id} of the {@link Point}
     */
    indexOf(id: string) {
        const { items } = this;
        return items.findIndex((p) => p.id === id);
    }

    /**
     * @summary gets a {@link Point} at at {@link index}
     * @param index index to get the {@link Point} at
     */
    pointAt(index: number): Point | undefined {
        const { items } = this;
        return items[index];
    }

    /**
     * @summary gets a {@link Point} by its {@link Point.id}
     * @param id {@link Point.id} to lookup
     */
    pointById(id: string) {
        const { items } = this;
        return items.find((point) => point.id === id);
    }

    pushPoints(...records: PointConfig[]) {
        const { colour: serieColor, graph } = this;

        return this.push(() =>
            records.map((config) => {
                const { colour = serieColor } = config;
                return new Point(graph, this, {
                    colour,
                    ...config
                });
            })
        );
    }

    /**
     * @summary removes a {@link Point} at the start of the serie
     */
    shift(): Point | undefined {
        const { items } = this;
        const point = items.shift();
        return point?.destroy();
    }

    create(): UtilSVGElement<SVGGElement> {
        const { size, colour, id } = this;

        const group = document.createElementNS<SVGGElement>(SVG_NS, "g");

        const path = document.createElementNS(SVG_NS, "path");
        path.id = id;

        const { style } = path;
        style.fill = "none";
        style.stroke = colour;
        style.strokeWidth = size.toString();

        group.append(path);
        return this.element = group;
    }

    draw() {
        const { element = this.create(), graph } = this;
        this.items.forEach((point) => point.draw());
        graph.element?.append(element);
        return this.sync();
    }

    sync(): GraphSerie & { element: UtilSVGElement<SVGGElement>; } {
        const { element = this.create(), items, graph, curved } = this;

        if (items.length < 2) {
            return this as GraphSerie & { element: UtilSVGElement<SVGGElement>; };
        }

        const { height } = graph;

        const [first, ...rest] = items;

        const d = rest.reduce((a, cur, i) => {
            const prev = items[i];

            const endPos = `${cur.x},${height - cur.y}`;

            return `${a} ${curved ? `S ${(cur.x + prev.x) / 2},${height - cur.y},${endPos}` : `L ${endPos}`}`;
        }, `M ${first.x},${height - first.y}`);

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
    id?: string;
    rotate?: number;
    size?: number | string;
    text: string;
};

export type AxisLabelLineConfig = {
    colour?: string;
    interval?: number;
    labels?: string[];
    rotate?: number;
    size?: number | string;
};

export class AxisLabel extends Drawable<AxisLabel, SVGTextElement> {
    colour = "black";
    id: string;
    rotate = 0;
    size: number | string = 10;
    text: string;

    constructor(public graph: LineGraph, public line: AxisLabelLine, config: AxisLabelConfig) {
        super();

        const { colour, rotate, size, text, id } = config;

        this.id = id || `label-${line.numLabels}-${Date.now()}`;
        this.text = text;
        this.colour = colour || line.colour;

        if (rotate) this.rotate = rotate;
        if (size) this.size = size;
    };

    get index() {
        const { line, id } = this;
        return line.items.findIndex((label) => label.id === id);
    }

    create(): SVGTextElement {
        const { id } = this;

        const text = document.createElementNS(SVG_NS, "text");
        text.id = id;

        return this.element = text;
    }

    draw() {
        const { element = this.create(), line } = this;
        if (!element.isConnected) line.element?.append(element);
        return this.sync();
    }

    sync(): DrawnDrawable<AxisLabel, SVGTextElement> {
        const { element = this.create(), graph, line, index, rotate, text, colour, size } = this;

        const fontSize = typeof size === "number" ? `${size}px` : size;

        const { lineSize, interval } = line;

        const x = 0 + interval * index;
        const y = graph.height + lineSize;

        element.setAttribute("x", (x - interval / 2).toString());
        element.setAttribute("y", y.toString());
        element.setAttribute("font-size", fontSize);
        element.setAttribute("fill", colour);

        if (rotate) {
            element.setAttribute("transform", `rotate(${-rotate},${x},${y})`);
        }

        element.textContent = text;
        return this as DrawnDrawable<AxisLabel, SVGTextElement>;
    }
}

export class AxisLabelLine extends Drawable<AxisLabelLine, SVGGElement> {
    colour = "black";
    items: AxisLabel[] = [];
    rotate = 0;
    size: number | string = 10;
    lineSize = 20;

    constructor(public graph: LineGraph, config: AxisLabelLineConfig = {}) {
        super();

        const {
            colour,
            labels = [],
            rotate,
            size,
        } = config;

        this.add(...labels);

        if (colour) this.colour = colour;
        if (rotate) this.rotate = rotate;
        if (size) this.size = size;
    }

    get interval() {
        const { graph } = this;
        return graph.pointXshift;
    }

    get numLabels() {
        const { items } = this;
        return items.length;
    }

    add(...labels: string[]): AxisLabelLine {
        const { items, colour, graph, size, rotate } = this;
        items.push(...labels.map((text) => {
            return new AxisLabel(graph, this, {
                text, colour, size, rotate
            });
        }));
        return this;
    }

    has(label: string): boolean {
        const { items } = this;
        return items.some((item) => item.text === label);
    }

    create() {
        const group = document.createElementNS(SVG_NS, "g");
        return this.element = group;
    }

    draw() {
        this.element || this.create();
        this.items.forEach((label) => label.draw());
        return this.sync();
    }

    shift(): AxisLabel | undefined {
        const { items } = this;
        const label = items.shift();
        return label?.destroy();
    }

    sync(): DrawnDrawable<AxisLabelLine, SVGGElement> {
        // TODO: what to sync here?
        return this as DrawnDrawable<AxisLabelLine, SVGGElement>;
    }
};

export class GraphAxis extends Drawable<GraphAxis, SVGGElement> {
    makeX = true;
    makeY = true;
    size = 1;

    xLine: AxisLine;
    yLine: AxisLine;

    xLabel: AxisLabelLine;

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
        this.xLabel = new AxisLabelLine(graph, {
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
        const { makeX, makeY, xLine, yLine, xLabel, element = this.create(), graph } = this;

        if (makeX) {
            xLabel.draw();
            xLine.draw();
        }

        if (makeY) {
            yLine.draw();
        }

        if (!element.isConnected) graph.element?.append(element);
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

export type GraphGridLineConfig = {
    colour?: string;
    direction: LineDirection;
    id: string;
};

export class GraphGridLine extends Drawable<GraphGridLine, SVGLineElement> {
    colour: string;
    direction: LineDirection = "horizontal";
    id: string;

    constructor(public graph: LineGraph, public grid: GraphGrid, config: GraphGridLineConfig) {
        super();

        const { colour, direction, id } = config;

        this.colour = colour || grid.colour;
        this.direction = direction;
        this.id = id;
    }

    get index() {
        const { grid, direction, id } = this;
        const collection = direction === "horizontal" ? grid.xLines : grid.yLines;
        return collection.findIndex((line) => line.id === id);
    }

    create(): SVGLineElement {
        const line = document.createElementNS(SVG_NS, "line");
        return this.element = line;
    }

    draw() {
        const { element = this.create(), grid } = this;
        if (!element.isConnected) grid.element?.append(element);
        return this.sync();
    }

    sync(): DrawnDrawable<GraphGridLine, SVGLineElement> {
        const { grid, colour, direction, index, graph, element = this.create() } = this;

        const offset = grid.size * (index + 1);

        const { style } = element;
        style.stroke = colour;
        style.strokeWidth = "0.5";

        const { height, width } = graph;

        const startX = 2;
        const endX = width - 2;
        const startY = height;
        const endY = 0;

        if (direction === "vertical") {
            element.setAttribute("x1", startX.toString());
            element.setAttribute("x2", endX.toString());
            element.setAttribute("y1", (startY - offset).toString());
            element.setAttribute("y2", (startY - offset).toString());
        }

        if (direction === "horizontal") {
            element.setAttribute("x1", (startX + offset).toString());
            element.setAttribute("x2", (startX + offset).toString());
            element.setAttribute("y1", startY.toString());
            element.setAttribute("y2", endY.toString());
        }

        return this as DrawnDrawable<GraphGridLine, SVGLineElement>;
    }
}

export class GraphGrid extends Drawable<GraphGrid, SVGGElement> {
    horizontal: boolean;
    vertical: boolean;

    colour = "black";
    size = 1;

    xLines: GraphGridLine[] = [];
    yLines: GraphGridLine[] = [];

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

    updateLines() {
        const { xLines, yLines, numXcells, numYcells, graph, colour } = this;
        xLines.forEach((line) => line.destroy());
        yLines.forEach((line) => line.destroy());

        xLines.length = 0;
        yLines.length = 0;

        for (let i = 1; i < numXcells; i++) {
            xLines.push(new GraphGridLine(graph, this, {
                id: `grid-x-line-${i}`,
                direction: "horizontal",
                colour,
            }));
        }

        for (let i = 1; i < numYcells; i++) {
            yLines.push(new GraphGridLine(graph, this, {
                id: `grid-y-line-${i}`,
                direction: "vertical",
                colour,
            }));
        }
    }

    create(): SVGGElement {
        const group = document.createElementNS(SVG_NS, "g");
        return this.element = group;
    }

    draw() {
        const { element = this.create(), graph, xLines, yLines, vertical, horizontal } = this;

        this.updateLines(); // TODO: partial updates

        if (horizontal) xLines.forEach((line) => line.draw());
        if (vertical) yLines.forEach((line) => line.draw());

        if (!element.isConnected) graph.element?.append(element);
        return this.sync();
    }

    sync(): DrawnDrawable<GraphGrid, SVGGElement> {
        // TODO: what to sync here?
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

    get pointXshift() {
        const { width, maxNumPoints } = this;
        return Math.floor(width / maxNumPoints);
    }

    /**
     * @summary gets a number of {@link Point}s in the biggest {@link GraphSerie}
     */
    get maxNumPoints(): number {
        const { items } = this;
        return Math.max(...items.map((serie) => serie.items.length));
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

    hasXaxisLabel(label: string): boolean {
        const { axis: { xLabel } } = this;
        return xLabel.has(label);
    }

    addXaxisLabel(label: string): LineGraph {
        const { axis: { xLabel } } = this;
        xLabel.add(label);
        return this;
    }

    /**
     * @summary removes a label from the start of the X axis
     */
    shiftXaxisLabels(): AxisLabel | undefined {
        const { axis: { xLabel } } = this;
        return xLabel.shift();
    }

    /**
     * @summary shifts the whole graph by one {@link Point}
     */
    shift(): LineGraph {
        const { items } = this;
        this.shiftXaxisLabels();
        items.forEach((serie) => serie.shift());
        return this;
    }

    create(): UtilSVGElement<SVGSVGElement> {
        const { id } = this;

        const element = document.createElementNS<SVGSVGElement>(SVG_NS, "svg");
        element.setAttribute("id", id);

        return this.element = element;
    }

    destroy() {
        this.element?.remove();
        return this;
    }

    draw(): DrawnDrawable<LineGraph, SVGSVGElement> {
        const { grid, axis, items } = this;

        this.element || this.create();

        axis.draw();
        grid.draw();
        items.forEach((serie) => serie.draw());

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
