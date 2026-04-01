export type FailStatus = 'LOAD_FAIL' | 'SVG_NOT_SUPPORTED' | 'SVG_INVALID';

export interface SVGInjectOptions {
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

export type CacheEntry =
  | { type: 'pending'; callbacks: Array<(entry: CacheEntry) => void> }
  | { type: 'loaded'; svgString: string }
  | { type: 'failed'; status: FailStatus };

export interface SVGInjectFunction {
  (
    img: HTMLImageElement | HTMLImageElement[] | NodeListOf<HTMLImageElement>,
    options?: SVGInjectOptions,
  ): Promise<void>;
  setOptions(options: SVGInjectOptions): void;
  create(globalName: string, options?: SVGInjectOptions): SVGInjectFunction;
  err(img: HTMLImageElement, fallbackSrc?: string): void;
}
