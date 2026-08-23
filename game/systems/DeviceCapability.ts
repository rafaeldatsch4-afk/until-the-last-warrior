export function detectLowEndDevice(): boolean {
  try {
    const nav = navigator as any;

    // CPU com 2 núcleos ou menos (dispositivos de entrada)
    const veryLowCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;

    // Menos de 2 GB de memória RAM disponível
    const veryLowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;

    // Telas de baixa resolução / taxa de quadros reduzida
    const isSmallScreenLowSpec = (window.innerWidth <= 480 || window.innerHeight <= 480) && (veryLowCores || veryLowMemory);

    return !!(veryLowCores || veryLowMemory || isSmallScreenLowSpec);
  } catch (e) {
    return false;
  }
}

