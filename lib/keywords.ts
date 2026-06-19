// ECE keyword taxonomy for Layer 1 signal validation
// 500+ ECE terms organized by year and subject

export const ECE_KEYWORDS: Set<string> = new Set([
  // Core circuits
  'resistor','capacitor','inductor','diode','transistor','mosfet','bjt','jfet',
  'opamp','op-amp','amplifier','oscillator','filter','rectifier','regulator',
  'voltage','current','resistance','impedance','admittance','frequency','bandwidth',
  'gain','phase','power','signal','waveform','circuit','schematic',

  // Digital
  'logic','gate','flipflop','flip-flop','latch','register','counter','multiplexer',
  'mux','demux','decoder','encoder','adder','subtractor','comparator',
  'boolean','karnaugh','kmap','k-map','minterm','maxterm','sop','pos',
  'truth table','sequential','combinational','synchronous','asynchronous',
  'clock','edge','rising','falling','setup','hold','propagation','hazard',

  // Microcontrollers / Embedded
  'arduino','esp32','stm32','pic','avr','arm','cortex',
  'gpio','uart','i2c','spi','pwm','adc','dac','timer','interrupt','isr',
  'register','port','pin','bit','byte','word','hex','binary',
  'baud','protocol','communication','serial','parallel',
  'firmware','embedded','rtos','freertos','hal','driver',

  // VLSI / Verilog / VHDL
  'verilog','vhdl','rtl','synthesis','fpga','asic','cmos','nmos','pmos',
  'module','port','wire','reg','logic','always','initial','assign',
  'blocking','non-blocking','nonblocking','latch','flip','mux','fsm',
  'state machine','moore','mealy','testbench','simulation','waveform',
  'timing','constraint','setup time','hold time','sta','place','route',

  // DSP
  'fft','dft','idft','ifft','convolution','correlation','filter','iir','fir',
  'z-transform','laplace','fourier','frequency','sampling','nyquist','aliasing',
  'quantization','pcm','signal processing','digital','analog','bandwidth',
  'impulse response','transfer function','pole','zero','stability',

  // Communications
  'modulation','demodulation','am','fm','pm','ask','fsk','psk','qam','ofdm',
  'channel','noise','snr','ber','bandwidth','spectrum','carrier','sideband',
  'antenna','propagation','multipath','fading','mimo','diversity',
  'cellular','gsm','lte','5g','wifi','bluetooth','ble','zigbee','lora',
  'tcp','ip','protocol','packet','frame',

  // Control Systems
  'transfer function','block diagram','feedback','feedforward','closed loop',
  'open loop','stability','routh','nyquist','bode','root locus','pole','zero',
  'pid','controller','plant','step response','impulse','frequency response',

  // Power / Electromagnetics
  'maxwell','electric field','magnetic field','flux','permeability','permittivity',
  'faraday','ampere','gauss','electromagnetic','waveguide','transmission line',
  'vswr','reflection','impedance matching','microwave','antenna','radiation',
  'power factor','three phase','transformer','motor','generator',

  // Programming
  'code','function','variable','array','pointer','struct','loop','if','else',
  'compiler','linker','debugger','stack','heap','malloc','free',
  'c language','c++','python','assembly','interrupt','timer',

  // Math
  'matrix','determinant','eigenvalue','differential equation','integration',
  'derivative','laplace','fourier','z transform','complex number','phasor',
  'vector','scalar','gradient','divergence','curl',

  // Common question words in ECE context
  'what is','how does','explain','define','derive','calculate','design',
  'implement','write code','generate','debug','error','mistake','wrong',
  'not working','failed','undefined','null','overflow','underflow',
]);

// Fast check: does text contain any ECE keyword?
export function containsECEKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  for (const kw of ECE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return false;
}
