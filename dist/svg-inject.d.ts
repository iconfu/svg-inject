type FailStatus = 'LOAD_FAIL' | 'SVG_NOT_SUPPORTED' | 'SVG_INVALID';
interface SVGInjectOptions {
    useCache?: boolean;
    copyAttributes?: boolean;
    makeIdsUnique?: boolean;
    sanitize?: boolean;
    injectStyleTag?: boolean;
    beforeLoad?: (img: HTMLImageElement) => string | void;
    afterLoad?: (svg: SVGSVGElement, svgString: string) => string | SVGSVGElement | void;
    beforeInject?: (img: HTMLImageElement, svg: SVGSVGElement) => Element | void;
    afterInject?: (img: HTMLImageElement, svg: Element) => void;
    onAllFinish?: () => void;
    onFail?: (img: HTMLImageElement, status: FailStatus) => void;
}
type CacheEntry = {
    type: 'pending';
    callbacks: Array<(entry: CacheEntry) => void>;
} | {
    type: 'loaded';
    svgString: string;
} | {
    type: 'failed';
    status: FailStatus;
};
interface SVGInjectFunction {
    (img: HTMLImageElement | HTMLImageElement[] | NodeListOf<HTMLImageElement>, options?: SVGInjectOptions): Promise<void>;
    setOptions(options: SVGInjectOptions): void;
    create(globalName: string, options?: SVGInjectOptions): SVGInjectFunction;
    err(img: HTMLImageElement, fallbackSrc?: string): void;
}

/**
 * Creates an SVGInject instance with its own cache and default options.
 */
declare function createSVGInject(globalName: string, options?: SVGInjectOptions, _assignToWindow?: boolean): SVGInjectFunction;
declare const SVGInject: SVGInjectFunction;

export { type CacheEntry, type FailStatus, SVGInject, type SVGInjectFunction, type SVGInjectOptions, createSVGInject, SVGInject as default };
