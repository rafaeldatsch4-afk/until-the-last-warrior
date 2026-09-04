import Phaser from "phaser";

export interface HighResLoadOptions {
  /** High-resolution image URL candidate. If omitted, will be generated using suffix. */
  highResUrl?: string;
  /** Suffix to append to filename (e.g. '@2x', '@3x', '_hd'). Defaults based on DPR. */
  suffix?: string;
  /** Custom resolution multiplier to override devicePixelRatio. */
  resolution?: number;
  /** Texture filter mode (LINEAR for smooth rendering, NEAREST for crisp pixel art). */
  filterMode?: Phaser.Textures.FilterMode;
  /** Optional callback after successful load and resolution configuration */
  onSuccess?: (texture: Phaser.Textures.Texture) => void;
  /** Optional callback on fallback */
  onFallback?: (err: any) => void;
}

export class HighResTextureManager {
  private static availabilityCache: Map<string, boolean> = new Map();
  private static activeProbes: Map<string, Promise<boolean>> = new Map();

  /**
   * Returns the current device pixel ratio clamped within safe boundaries [1, 3]
   * to protect mobile GPU memory while ensuring crisp Retina rendering.
   */
  public static getDevicePixelRatio(): number {
    if (typeof window === "undefined") return 1;
    const rawDpr = window.devicePixelRatio || 1;
    return Math.max(1, Math.min(rawDpr, 3));
  }

  /**
   * Returns whether the current device is a high-DPI / Retina display (DPR >= 1.5).
   */
  public static isRetina(): boolean {
    return HighResTextureManager.getDevicePixelRatio() >= 1.5;
  }

  /**
   * Returns whether the current device is a Super-Retina / 3x display (DPR >= 2.5).
   */
  public static isSuperRetina(): boolean {
    return HighResTextureManager.getDevicePixelRatio() >= 2.5;
  }

  /**
   * Returns an integer resolution multiplier for asset selection (1, 2, or 3).
   */
  public static getResolutionMultiplier(): number {
    const dpr = HighResTextureManager.getDevicePixelRatio();
    if (dpr >= 2.5) return 3;
    if (dpr >= 1.5) return 2;
    return 1;
  }

  /**
   * Returns standard high-resolution file suffix based on devicePixelRatio:
   * e.g. '@3x' for 3x screens, '@2x' for Retina screens, '' for standard 1x.
   */
  public static getResolutionSuffix(forcedDpr?: number): string {
    const mult = forcedDpr !== undefined 
      ? (forcedDpr >= 2.5 ? 3 : forcedDpr >= 1.5 ? 2 : 1) 
      : HighResTextureManager.getResolutionMultiplier();
    if (mult === 3) return "@3x";
    if (mult === 2) return "@2x";
    return "";
  }

  /**
   * Computes a candidate high-resolution URL from a base URL.
   * e.g., 'assets/sprites/itachi.png' -> 'assets/sprites/itachi@2x.png'
   */
  public static resolveCandidateUrl(baseUrl: string, suffix?: string): string {
    const activeSuffix = suffix ?? HighResTextureManager.getResolutionSuffix();
    if (!activeSuffix) return baseUrl;

    // Detect extension
    const lastDot = baseUrl.lastIndexOf(".");
    if (lastDot === -1 || baseUrl.startsWith("data:") || baseUrl.startsWith("blob:")) {
      return baseUrl;
    }

    const base = baseUrl.substring(0, lastDot);
    const ext = baseUrl.substring(lastDot);
    return `${base}${activeSuffix}${ext}`;
  }

  /**
   * Probes whether a given texture URL is reachable / available on the network or asset server.
   * Caches results so multiple requests don't generate duplicate HTTP queries.
   */
  public static async isTextureAvailable(url: string): Promise<boolean> {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
      return true;
    }

    if (HighResTextureManager.availabilityCache.has(url)) {
      return HighResTextureManager.availabilityCache.get(url)!;
    }

    if (HighResTextureManager.activeProbes.has(url)) {
      return HighResTextureManager.activeProbes.get(url)!;
    }

    const probePromise = new Promise<boolean>((resolve) => {
      // 1. Try Image element probe (fast and handles cross-origin or local assets safely)
      const img = new Image();
      let finished = false;

      const timeoutId = setTimeout(() => {
        if (!finished) {
          finished = true;
          HighResTextureManager.availabilityCache.set(url, false);
          HighResTextureManager.activeProbes.delete(url);
          resolve(false);
        }
      }, 1500);

      img.onload = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);
          HighResTextureManager.availabilityCache.set(url, true);
          HighResTextureManager.activeProbes.delete(url);
          resolve(true);
        }
      };

      img.onerror = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeoutId);
          HighResTextureManager.availabilityCache.set(url, false);
          HighResTextureManager.activeProbes.delete(url);
          resolve(false);
        }
      };

      try {
        img.src = url;
      } catch {
        finished = true;
        clearTimeout(timeoutId);
        HighResTextureManager.availabilityCache.set(url, false);
        HighResTextureManager.activeProbes.delete(url);
        resolve(false);
      }
    });

    HighResTextureManager.activeProbes.set(url, probePromise);
    return probePromise;
  }

  /**
   * Loads an image into Phaser's Loader queue with automatic Retina / high-resolution
   * resolution detection and transparent fallback to standard resolution if the
   * high-resolution asset is unavailable.
   */
  public static loadHighResImage(
    loader: Phaser.Loader.LoaderPlugin,
    key: string,
    defaultUrl: string,
    options?: HighResLoadOptions
  ): void {
    const isRetina = HighResTextureManager.isRetina();
    const resolution = options?.resolution ?? HighResTextureManager.getResolutionMultiplier();
    const filterMode = options?.filterMode ?? Phaser.Textures.FilterMode.LINEAR;

    // If on standard 1x display, load directly
    if (!isRetina || resolution === 1) {
      loader.image(key, defaultUrl);
      loader.once(`filecomplete-image-${key}`, () => {
        const tex = loader.textureManager.get(key);
        if (tex) {
          tex.setFilter(filterMode);
          if (options?.onSuccess) options.onSuccess(tex);
        }
      });
      return;
    }

    // Determine high-res candidate URL
    const highResUrl = options?.highResUrl || HighResTextureManager.resolveCandidateUrl(defaultUrl, options?.suffix);

    // If highResUrl is identical to defaultUrl, load standard
    if (highResUrl === defaultUrl) {
      loader.image(key, defaultUrl);
      loader.once(`filecomplete-image-${key}`, () => {
        const tex = loader.textureManager.get(key);
        if (tex) {
          tex.setFilter(filterMode);
          if (options?.onSuccess) options.onSuccess(tex);
        }
      });
      return;
    }

    // Set up high-res loading with fallback
    let highResFailed = false;

    const errorHandler = (file: any) => {
      if (file && file.key === key && !highResFailed) {
        highResFailed = true;
        console.info(`[HighResTextureManager] High-res asset not available for '${key}', falling back to default resolution.`);
        
        // Remove error listener for this file
        loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);

        // Queue standard resolution file as fallback
        loader.image(key, defaultUrl);
        loader.once(`filecomplete-image-${key}`, () => {
          const tex = loader.textureManager.get(key);
          if (tex) {
            tex.setFilter(filterMode);
            if (options?.onFallback) options.onFallback(null);
          }
        });
        
        // Resume loader if already running
        if (loader.isLoading()) {
          loader.start();
        }
      }
    };

    loader.on(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);

    // Queue high-res image
    loader.image(key, highResUrl);

    loader.once(`filecomplete-image-${key}`, () => {
      loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);
      if (!highResFailed) {
        const tex = loader.textureManager.get(key);
        if (tex) {
          // Adjust texture source resolution so coordinates match 1x logical dimensions
          HighResTextureManager.applyResolutionToTexture(tex, resolution, filterMode);
          if (options?.onSuccess) options.onSuccess(tex);
        }
      }
    });
  }

  /**
   * Loads a spritesheet with high-res detection and frame dimension scaling.
   */
  public static loadHighResSpriteSheet(
    loader: Phaser.Loader.LoaderPlugin,
    key: string,
    defaultUrl: string,
    frameWidth: number,
    frameHeight: number,
    options?: HighResLoadOptions
  ): void {
    const isRetina = HighResTextureManager.isRetina();
    const resolution = options?.resolution ?? HighResTextureManager.getResolutionMultiplier();
    const filterMode = options?.filterMode ?? Phaser.Textures.FilterMode.NEAREST;

    if (!isRetina || resolution === 1) {
      loader.spritesheet(key, defaultUrl, { frameWidth, frameHeight });
      loader.once(`filecomplete-spritesheet-${key}`, () => {
        const tex = loader.textureManager.get(key);
        if (tex) {
          tex.setFilter(filterMode);
          if (options?.onSuccess) options.onSuccess(tex);
        }
      });
      return;
    }

    const highResUrl = options?.highResUrl || HighResTextureManager.resolveCandidateUrl(defaultUrl, options?.suffix);

    if (highResUrl === defaultUrl) {
      loader.spritesheet(key, defaultUrl, { frameWidth, frameHeight });
      return;
    }

    let highResFailed = false;
    const errorHandler = (file: any) => {
      if (file && file.key === key && !highResFailed) {
        highResFailed = true;
        loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);
        loader.spritesheet(key, defaultUrl, { frameWidth, frameHeight });
        if (loader.isLoading()) loader.start();
      }
    };

    loader.on(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);

    // For 2x or 3x spritesheets, frame dimensions in file are multiplied by resolution
    loader.spritesheet(key, highResUrl, {
      frameWidth: frameWidth * resolution,
      frameHeight: frameHeight * resolution,
    });

    loader.once(`filecomplete-spritesheet-${key}`, () => {
      loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, errorHandler);
      if (!highResFailed) {
        const tex = loader.textureManager.get(key);
        if (tex) {
          HighResTextureManager.applyResolutionToTexture(tex, resolution, filterMode);
          if (options?.onSuccess) options.onSuccess(tex);
        }
      }
    });
  }

  /**
   * Applies resolution scaling to an existing Phaser Texture so that it uses
   * higher pixel density internally while retaining exact logical coordinates in game space.
   */
  public static applyResolutionToTexture(
    texture: Phaser.Textures.Texture,
    resolution: number,
    filterMode: Phaser.Textures.FilterMode = Phaser.Textures.FilterMode.LINEAR
  ): void {
    if (!texture) return;

    texture.setFilter(filterMode);
  }

  /**
   * Creates a procedural CanvasTexture rendered at high-DPI based on devicePixelRatio,
   * with anti-aliasing and LINEAR filtering to ensure crystal clear graphics on Retina displays.
   */
  public static createHighResCanvasTexture(
    scene: Phaser.Scene,
    key: string,
    logicalWidth: number,
    logicalHeight: number,
    drawCallback: (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      scale: number
    ) => void,
    options?: {
      filterMode?: Phaser.Textures.FilterMode;
      forceDpr?: number;
    }
  ): Phaser.Textures.CanvasTexture | null {
    if (!scene || !scene.textures) return null;

    const dpr = options?.forceDpr ?? HighResTextureManager.getResolutionMultiplier();
    const filterMode = options?.filterMode ?? Phaser.Textures.FilterMode.LINEAR;

    // Remove existing texture if it exists to avoid conflicts
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }

    const bufferWidth = Math.round(logicalWidth * dpr);
    const bufferHeight = Math.round(logicalHeight * dpr);

    const canvasTexture = scene.textures.createCanvas(key, bufferWidth, bufferHeight);
    if (!canvasTexture) return null;

    canvasTexture.setFilter(filterMode);

    const ctx = canvasTexture.getContext();
    if (ctx) {
      ctx.save();
      // Configure high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Scale coordinates so drawer writes using standard logicalWidth/logicalHeight
      ctx.scale(dpr, dpr);

      try {
        drawCallback(ctx, logicalWidth, logicalHeight, dpr);
      } catch (e) {
        console.error(`[HighResTextureManager] Error rendering canvas texture '${key}':`, e);
      } finally {
        ctx.restore();
      }
    }

    canvasTexture.refresh();

    return canvasTexture;
  }

  /**
   * Returns the optimal resolution for Phaser Text objects to guarantee crisp,
   * unpixelated typography on Retina / 4K / Mobile screens.
   */
  public static getTextResolution(minResolution: number = 2): number {
    const dpr = HighResTextureManager.getDevicePixelRatio();
    return Math.max(minResolution, Math.ceil(dpr));
  }
}
