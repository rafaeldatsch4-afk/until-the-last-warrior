export function detectLowEndDevice(): boolean {
  try {
    const nav = navigator as any;

    // CPU fraco (poucos núcleos)
    const lowCores = nav.hardwareConcurrency && nav.hardwareConcurrency <= 4;

    // Pouca memória RAM disponível (API não suportada em todos navegadores, então é opcional)
    const lowMemory = nav.deviceMemory && nav.deviceMemory <= 4;

    // Mobile geralmente se beneficia do modo leve por padrão
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    return !!(lowCores || lowMemory || isMobile);
  } catch (e) {
    return false;
  }
}
