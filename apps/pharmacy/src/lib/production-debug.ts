/**
 * Production Environment Debug Helper
 *
 * This module provides detailed debugging information for production deployment issues.
 * It helps identify why the application might not be rendering correctly in production.
 */

interface DebugInfo {
  timestamp: string;
  environment: string;
  userAgent: string;
  url: string;
  reactVersion?: string;
  errors: string[];
  warnings: string[];
  domState: {
    rootElement: boolean;
    rootChildren: number;
    hasReactRoot: boolean;
  };
  moduleLoadState: {
    criticalFixesLoaded: boolean;
    vercelFixesApplied: boolean;
    reactFixesApplied: boolean;
  };
  performanceMetrics: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
}

class ProductionDebugger {
  private debugInfo: DebugInfo;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.debugInfo = {
      timestamp: new Date().toISOString(),
      environment: this.detectEnvironment(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errors: [],
      warnings: [],
      domState: {
        rootElement: false,
        rootChildren: 0,
        hasReactRoot: false,
      },
      moduleLoadState: {
        criticalFixesLoaded: false,
        vercelFixesApplied: false,
        reactFixesApplied: false,
      },
      performanceMetrics: {
        domContentLoaded: 0,
        loadComplete: 0,
      },
    };

    this.initializeDebugger();
  }

  private detectEnvironment(): string {
    if (window.location.hostname.includes('vercel.app'))
      return 'vercel-production';
    if (window.location.hostname.includes('localhost'))
      return 'local-development';
    if (window.location.hostname.includes('127.0.0.1'))
      return 'local-development';
    return 'unknown';
  }

  private initializeDebugger(): void {
    // Capture performance metrics
    if (performance.timing) {
      this.debugInfo.performanceMetrics.domContentLoaded =
        performance.timing.domContentLoadedEventEnd -
        performance.timing.navigationStart;
      this.debugInfo.performanceMetrics.loadComplete =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
    }

    // Capture paint metrics
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          this.debugInfo.performanceMetrics.firstPaint = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          this.debugInfo.performanceMetrics.firstContentfulPaint =
            entry.startTime;
        }
      });
    }

    // Monitor console errors
    this.setupErrorMonitoring();

    // Check DOM state periodically
    this.checkDOMState();

    // Set up periodic checks
    setTimeout(() => this.checkDOMState(), 1000);
    setTimeout(() => this.checkDOMState(), 3000);
    setTimeout(() => this.checkDOMState(), 5000);
  }

  private setupErrorMonitoring(): void {
    // Capture console errors
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      this.errors.push(args.map(arg => String(arg)).join(' '));
      originalError.apply(console, args);
    };

    // Capture console warnings
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      this.warnings.push(args.map(arg => String(arg)).join(' '));
      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', event => {
      this.errors.push(
        `Unhandled error: ${event.message} at ${event.filename}:${event.lineno}`
      );
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.errors.push(`Unhandled promise rejection: ${event.reason}`);
    });
  }

  private checkDOMState(): void {
    const rootElement = document.getElementById('root');
    this.debugInfo.domState.rootElement = !!rootElement;
    this.debugInfo.domState.rootChildren = rootElement
      ? rootElement.children.length
      : 0;

    // Check if React has rendered
    this.debugInfo.domState.hasReactRoot = !!(
      rootElement &&
      (rootElement.hasAttribute('data-reactroot') ||
        rootElement.children.length > 0)
    );

    // Check module load states
    this.debugInfo.moduleLoadState.criticalFixesLoaded = !!(
      window as typeof window & { CRITICAL_FIXES_LOADED?: boolean }
    ).CRITICAL_FIXES_LOADED;
    this.debugInfo.moduleLoadState.vercelFixesApplied = !!(
      window as typeof window & { __VERCEL_FIXES_APPLIED__?: boolean }
    ).__VERCEL_FIXES_APPLIED__;
    this.debugInfo.moduleLoadState.reactFixesApplied = !!(
      window as typeof window & { __REACT_FIXES_APPLIED__?: boolean }
    ).__REACT_FIXES_APPLIED__;

    // Try to detect React version
    const globalReact = (
      window as typeof window & { React?: { version?: string } }
    ).React;
    if (globalReact) {
      this.debugInfo.reactVersion = globalReact.version;
    }

    // Update error and warning arrays
    this.debugInfo.errors = [...this.errors];
    this.debugInfo.warnings = [...this.warnings];
  }

  public getDebugInfo(): DebugInfo {
    this.checkDOMState();
    return { ...this.debugInfo };
  }

  public logDebugInfo(): void {
    const info = this.getDebugInfo();

    console.group('🔍 Production Debug Information');
    console.log('📊 Environment:', info.environment);
    console.log('⏰ Timestamp:', info.timestamp);
    console.log('🌐 URL:', info.url);
    console.log('🔧 React Version:', info.reactVersion || 'Not detected');

    console.group('📦 Module Load State');
    console.log(
      'Critical Fixes Loaded:',
      info.moduleLoadState.criticalFixesLoaded
    );
    console.log(
      'Vercel Fixes Applied:',
      info.moduleLoadState.vercelFixesApplied
    );
    console.log('React Fixes Applied:', info.moduleLoadState.reactFixesApplied);
    console.groupEnd();

    console.group('🏗️ DOM State');
    console.log('Root Element Exists:', info.domState.rootElement);
    console.log('Root Children Count:', info.domState.rootChildren);
    console.log('Has React Root:', info.domState.hasReactRoot);
    console.groupEnd();

    console.group('⚡ Performance Metrics');
    console.log(
      'DOM Content Loaded:',
      `${info.performanceMetrics.domContentLoaded}ms`
    );
    console.log('Load Complete:', `${info.performanceMetrics.loadComplete}ms`);
    if (info.performanceMetrics.firstPaint) {
      console.log('First Paint:', `${info.performanceMetrics.firstPaint}ms`);
    }
    if (info.performanceMetrics.firstContentfulPaint) {
      console.log(
        'First Contentful Paint:',
        `${info.performanceMetrics.firstContentfulPaint}ms`
      );
    }
    console.groupEnd();

    if (info.errors.length > 0) {
      console.group('❌ Errors');
      info.errors.forEach(error => console.error(error));
      console.groupEnd();
    }

    if (info.warnings.length > 0) {
      console.group('⚠️ Warnings');
      info.warnings.forEach(warning => console.warn(warning));
      console.groupEnd();
    }

    console.groupEnd();
  }

  public generateReport(): string {
    const info = this.getDebugInfo();
    return JSON.stringify(info, null, 2);
  }
}

// Initialize only when explicitly enabled via environment variable
if (
  typeof window !== 'undefined' &&
  import.meta.env.VITE_ENABLE_DEBUG === 'true'
) {
  const productionDebugger = new ProductionDebugger();

  // Make debugger available globally for manual inspection
  (
    window as typeof window & { __PRODUCTION_DEBUGGER__?: ProductionDebugger }
  ).__PRODUCTION_DEBUGGER__ = productionDebugger;

  console.log(
    '🔍 Production debugger enabled. Check window.__PRODUCTION_DEBUGGER__ for details.'
  );

  // Log debug info after a delay to capture more state
  setTimeout(() => {
    productionDebugger.logDebugInfo();
  }, 2000);

  // Log debug info when the page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      productionDebugger.logDebugInfo();
    }, 1000);
  });
} else if (typeof window !== 'undefined') {
  // Make ProductionDebugger available for manual debugging
  // User can manually create instance: new ProductionDebugger()
  (
    window as typeof window & { ProductionDebugger?: typeof ProductionDebugger }
  ).ProductionDebugger = ProductionDebugger;
}

export default ProductionDebugger;
