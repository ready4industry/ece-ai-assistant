// /lib/syllabus-data.ts — Complete 62-topic curriculum (AICTE/NBA-aligned)
// All topic_slug values are lowercase snake_case derived from topic names.
// All prerequisites arrays reference actual topic_slugs in this file.
// CO-PO mappings are illustrative — professor should confirm before seeding.

import type { SyllabusTopic } from './types';

export const SYLLABUS: SyllabusTopic[] = [
  // ══════════════════════════════════════════════════
  // YEAR 1, SEMESTER 1 — Basic Electrical Engineering
  // ══════════════════════════════════════════════════
  {
    year: 1, semester: 1,
    subject: 'basic_electrical_engineering', subject_label: 'Basic Electrical Engineering',
    topic: "Ohm's Law and Kirchhoff's Laws",
    topic_slug: 'ohms_law_kirchhoffs_laws',
    description: "Fundamental relationship between voltage, current, resistance; KCL and KVL for circuit analysis.",
    prerequisites: [],
    keywords: ['ohms law', 'KCL', 'KVL', 'voltage', 'current', 'resistance', 'kirchhoff'],
    complexity: 2,
    co_po_mapping: ['CO1-PO1'],
  },
  {
    year: 1, semester: 1,
    subject: 'basic_electrical_engineering', subject_label: 'Basic Electrical Engineering',
    topic: 'Series and Parallel Circuits',
    topic_slug: 'series_parallel_circuits',
    description: 'Equivalent resistance calculation for series and parallel resistor networks.',
    prerequisites: ['ohms_law_kirchhoffs_laws'],
    keywords: ['series', 'parallel', 'equivalent resistance', 'network', 'resistor'],
    complexity: 2,
    co_po_mapping: ['CO1-PO1'],
  },
  {
    year: 1, semester: 1,
    subject: 'basic_electrical_engineering', subject_label: 'Basic Electrical Engineering',
    topic: 'AC Fundamentals — RMS and Peak Values',
    topic_slug: 'ac_fundamentals_rms_peak',
    description: 'Sinusoidal waveform characteristics, RMS value derivation, peak and average value relationships.',
    prerequisites: ['ohms_law_kirchhoffs_laws'],
    keywords: ['RMS', 'peak value', 'sinusoidal', 'AC waveform', 'frequency', 'average value'],
    complexity: 3,
    co_po_mapping: ['CO2-PO1'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 1, SEMESTER 1 — Basic Electronics Engineering
  // ══════════════════════════════════════════════════
  {
    year: 1, semester: 1,
    subject: 'basic_electronics_engineering', subject_label: 'Basic Electronics Engineering',
    topic: 'PN Junction Diode',
    topic_slug: 'pn_junction_diode',
    description: 'Formation of depletion region, forward and reverse bias characteristics.',
    prerequisites: [],
    keywords: ['diode', 'PN junction', 'depletion region', 'forward bias', 'reverse bias'],
    complexity: 3,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 1, semester: 1,
    subject: 'basic_electronics_engineering', subject_label: 'Basic Electronics Engineering',
    topic: 'Half-Wave Rectifier',
    topic_slug: 'half_wave_rectifier',
    description: 'Single diode circuit converting AC to pulsating DC, ripple and efficiency calculation.',
    prerequisites: ['pn_junction_diode'],
    keywords: ['rectifier', 'half wave', 'ripple', 'efficiency', 'pulsating DC'],
    complexity: 3,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 1, semester: 1,
    subject: 'basic_electronics_engineering', subject_label: 'Basic Electronics Engineering',
    topic: 'Full-Wave Bridge Rectifier',
    topic_slug: 'full_wave_bridge_rectifier',
    description: 'Four-diode bridge configuration, both half cycles contribute to output.',
    prerequisites: ['half_wave_rectifier'],
    keywords: ['bridge rectifier', 'full wave', 'four diodes', 'ripple factor'],
    complexity: 4,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 1, semester: 1,
    subject: 'basic_electronics_engineering', subject_label: 'Basic Electronics Engineering',
    topic: 'Zener Diode Voltage Regulation',
    topic_slug: 'zener_diode_voltage_regulation',
    description: 'Reverse breakdown characteristic used for voltage regulation applications.',
    prerequisites: ['pn_junction_diode'],
    keywords: ['zener', 'breakdown voltage', 'regulation', 'reverse bias'],
    complexity: 4,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 1, SEMESTER 2 — Engineering Mathematics II
  // ══════════════════════════════════════════════════
  {
    year: 1, semester: 2,
    subject: 'engineering_mathematics_2', subject_label: 'Engineering Mathematics II',
    topic: 'Laplace Transform Fundamentals',
    topic_slug: 'laplace_transform_fundamentals',
    description: 'Transform definition, standard transform pairs, properties used in circuit analysis.',
    prerequisites: [],
    keywords: ['laplace transform', 's-domain', 'transfer function', 'partial fractions'],
    complexity: 5,
    co_po_mapping: ['CO3-PO1'],
  },
  {
    year: 1, semester: 2,
    subject: 'engineering_mathematics_2', subject_label: 'Engineering Mathematics II',
    topic: 'Fourier Series',
    topic_slug: 'fourier_series',
    description: 'Periodic signal decomposition into sinusoidal components.',
    prerequisites: ['ac_fundamentals_rms_peak'],
    keywords: ['fourier series', 'periodic signal', 'harmonics', 'coefficients'],
    complexity: 5,
    co_po_mapping: ['CO3-PO1'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 1, SEMESTER 2 — Programming in C
  // ══════════════════════════════════════════════════
  {
    year: 1, semester: 2,
    subject: 'programming_in_c', subject_label: 'Programming in C',
    topic: 'Pointers and Arrays',
    topic_slug: 'pointers_and_arrays',
    description: 'Memory addresses, pointer arithmetic, array-pointer relationship in C.',
    prerequisites: [],
    keywords: ['pointer', 'array', 'memory address', 'pointer arithmetic'],
    complexity: 4,
    co_po_mapping: ['CO4-PO2', 'CO4-PO3'],
  },
  {
    year: 1, semester: 2,
    subject: 'programming_in_c', subject_label: 'Programming in C',
    topic: 'Structures and File Handling',
    topic_slug: 'structures_file_handling',
    description: 'Custom data types, file I/O operations in C.',
    prerequisites: ['pointers_and_arrays'],
    keywords: ['struct', 'file handling', 'fopen', 'fread', 'fwrite'],
    complexity: 4,
    co_po_mapping: ['CO4-PO2', 'CO4-PO3'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 2, SEMESTER 3 — Digital Electronics and Logic Design
  // ══════════════════════════════════════════════════
  {
    year: 2, semester: 3,
    subject: 'digital_electronics_and_logic_design', subject_label: 'Digital Electronics & Logic Design',
    topic: 'Boolean Algebra and Logic Gates',
    topic_slug: 'boolean_algebra_logic_gates',
    description: 'Basic logic operations AND, OR, NOT, NAND, NOR and their Boolean expressions.',
    prerequisites: [],
    keywords: ['boolean algebra', 'logic gates', 'AND', 'OR', 'NOT', 'truth table'],
    complexity: 3,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 2, semester: 3,
    subject: 'digital_electronics_and_logic_design', subject_label: 'Digital Electronics & Logic Design',
    topic: 'Karnaugh Map Simplification',
    topic_slug: 'karnaugh_map',
    description: 'Graphical method for minimizing Boolean expressions using adjacent minterm grouping.',
    prerequisites: ['boolean_algebra_logic_gates'],
    keywords: ['K-map', 'minterm', 'SOP', 'POS', 'grouping', 'dont care'],
    complexity: 5,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 2, semester: 3,
    subject: 'digital_electronics_and_logic_design', subject_label: 'Digital Electronics & Logic Design',
    topic: 'Combinational Circuits — Multiplexers and Decoders',
    topic_slug: 'combinational_circuits_mux_decoder',
    description: 'Design and analysis of MUX, DEMUX, encoder, decoder circuits.',
    prerequisites: ['boolean_algebra_logic_gates', 'karnaugh_map'],
    keywords: ['multiplexer', 'demultiplexer', 'decoder', 'encoder', 'select lines'],
    complexity: 5,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 2, semester: 3,
    subject: 'digital_electronics_and_logic_design', subject_label: 'Digital Electronics & Logic Design',
    topic: 'Sequential Logic — Flip-Flops',
    topic_slug: 'sequential_logic_flip_flops',
    description: 'SR, D, JK, T flip-flop characteristics, truth tables, excitation tables.',
    prerequisites: ['boolean_algebra_logic_gates'],
    keywords: ['flip flop', 'SR', 'D', 'JK', 'T', 'clock', 'edge triggered', 'latch'],
    complexity: 6,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },
  {
    year: 2, semester: 3,
    subject: 'digital_electronics_and_logic_design', subject_label: 'Digital Electronics & Logic Design',
    topic: 'Counters and Shift Registers',
    topic_slug: 'counters_shift_registers',
    description: 'Synchronous and asynchronous counter design, shift register types.',
    prerequisites: ['sequential_logic_flip_flops'],
    keywords: ['counter', 'shift register', 'synchronous', 'asynchronous', 'modulo'],
    complexity: 6,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 2, SEMESTER 3 — Network Theory
  // ══════════════════════════════════════════════════
  {
    year: 2, semester: 3,
    subject: 'network_theory', subject_label: 'Network Theory',
    topic: "Thevenin's and Norton's Theorem",
    topic_slug: 'thevenins_nortons_theorem',
    description: 'Source equivalent circuit reduction for linear networks.',
    prerequisites: ['ohms_law_kirchhoffs_laws', 'series_parallel_circuits'],
    keywords: ['thevenin', 'norton', 'equivalent circuit', 'source transformation'],
    complexity: 5,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 2, semester: 3,
    subject: 'network_theory', subject_label: 'Network Theory',
    topic: 'Two-Port Network Parameters',
    topic_slug: 'two_port_network_parameters',
    description: 'Z, Y, ABCD, h-parameter representation of two-port networks.',
    prerequisites: ['thevenins_nortons_theorem'],
    keywords: ['two-port', 'Z-parameter', 'Y-parameter', 'ABCD', 'h-parameter'],
    complexity: 7,
    co_po_mapping: ['CO4-PO1', 'CO4-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 2, SEMESTER 4 — Analog Electronics
  // ══════════════════════════════════════════════════
  {
    year: 2, semester: 4,
    subject: 'analog_electronics', subject_label: 'Analog Electronics',
    topic: 'BJT Biasing and Operating Point',
    topic_slug: 'bjt_biasing_operating_point',
    description: 'Fixed bias, voltage divider bias, Q-point stability analysis.',
    prerequisites: ['pn_junction_diode'],
    keywords: ['BJT', 'biasing', 'Q-point', 'operating point', 'voltage divider'],
    complexity: 5,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'analog_electronics', subject_label: 'Analog Electronics',
    topic: 'BJT Small Signal Amplifier Analysis',
    topic_slug: 'bjt_small_signal_amplifier',
    description: 'CE, CB, CC amplifier configurations, gain and impedance calculation.',
    prerequisites: ['bjt_biasing_operating_point'],
    keywords: ['amplifier', 'common emitter', 'gain', 'input impedance', 'output impedance'],
    complexity: 6,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'analog_electronics', subject_label: 'Analog Electronics',
    topic: 'Operational Amplifier Fundamentals',
    topic_slug: 'op_amp_fundamentals',
    description: 'Ideal op-amp characteristics, inverting and non-inverting configurations.',
    prerequisites: ['bjt_small_signal_amplifier'],
    keywords: ['op-amp', 'inverting', 'non-inverting', 'virtual ground', 'gain'],
    complexity: 5,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'analog_electronics', subject_label: 'Analog Electronics',
    topic: 'Op-Amp Applications — Filters and Oscillators',
    topic_slug: 'op_amp_filters_oscillators',
    description: 'Active filter design, Wien bridge and RC phase shift oscillators.',
    prerequisites: ['op_amp_fundamentals'],
    keywords: ['active filter', 'oscillator', 'wien bridge', 'cutoff frequency'],
    complexity: 7,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 2, SEMESTER 4 — Signals and Systems
  // ══════════════════════════════════════════════════
  {
    year: 2, semester: 4,
    subject: 'signals_and_systems', subject_label: 'Signals & Systems',
    topic: 'Continuous and Discrete Time Signals',
    topic_slug: 'continuous_discrete_time_signals',
    description: 'Signal classification, basic signal operations — shifting, scaling, folding.',
    prerequisites: ['ac_fundamentals_rms_peak'],
    keywords: ['signal', 'continuous time', 'discrete time', 'shifting', 'scaling'],
    complexity: 4,
    co_po_mapping: ['CO1-PO1'],
  },
  {
    year: 2, semester: 4,
    subject: 'signals_and_systems', subject_label: 'Signals & Systems',
    topic: 'Convolution and LTI Systems',
    topic_slug: 'convolution_lti_systems',
    description: 'Convolution sum and integral, linear time-invariant system properties.',
    prerequisites: ['continuous_discrete_time_signals'],
    keywords: ['convolution', 'LTI', 'impulse response', 'linearity', 'time invariance'],
    complexity: 6,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'signals_and_systems', subject_label: 'Signals & Systems',
    topic: 'Sampling Theorem',
    topic_slug: 'sampling_theorem',
    description: 'Nyquist criterion, aliasing, signal reconstruction from samples.',
    prerequisites: ['convolution_lti_systems', 'fourier_series'],
    keywords: ['sampling theorem', 'nyquist rate', 'aliasing', 'reconstruction'],
    complexity: 6,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 2, SEMESTER 4 — Microcontrollers & Embedded Systems
  // ══════════════════════════════════════════════════
  {
    year: 2, semester: 4,
    subject: 'microcontrollers_and_embedded_systems', subject_label: 'Microcontrollers & Embedded Systems',
    topic: '8051/ARM Architecture Overview',
    topic_slug: 'microcontroller_architecture_overview',
    description: 'Register set, memory organization, addressing modes.',
    prerequisites: ['boolean_algebra_logic_gates'],
    keywords: ['8051', 'ARM', 'registers', 'memory map', 'addressing mode'],
    complexity: 5,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'microcontrollers_and_embedded_systems', subject_label: 'Microcontrollers & Embedded Systems',
    topic: 'GPIO Configuration and Digital I/O',
    topic_slug: 'gpio_digital_io',
    description: 'Pin configuration, input/output mode setting, digital read/write operations.',
    prerequisites: ['microcontroller_architecture_overview'],
    keywords: ['GPIO', 'digital I/O', 'pin configuration', 'input mode', 'output mode'],
    complexity: 4,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'microcontrollers_and_embedded_systems', subject_label: 'Microcontrollers & Embedded Systems',
    topic: 'Timer and Interrupt Configuration',
    topic_slug: 'timer_interrupt_configuration',
    description: 'Timer modes, prescaler calculation, interrupt service routines.',
    prerequisites: ['gpio_digital_io'],
    keywords: ['timer', 'interrupt', 'prescaler', 'ISR', 'period register'],
    complexity: 6,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },
  {
    year: 2, semester: 4,
    subject: 'microcontrollers_and_embedded_systems', subject_label: 'Microcontrollers & Embedded Systems',
    topic: 'UART Serial Communication',
    topic_slug: 'uart_serial_communication',
    description: 'Asynchronous serial protocol, baud rate configuration, frame format.',
    prerequisites: ['gpio_digital_io'],
    keywords: ['UART', 'baud rate', 'serial communication', 'asynchronous', 'frame'],
    complexity: 6,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 5 — VLSI Design
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 5,
    subject: 'vlsi_design', subject_label: 'VLSI Design',
    topic: 'CMOS Inverter Characteristics',
    topic_slug: 'cmos_inverter_characteristics',
    description: 'NMOS/PMOS operation, voltage transfer characteristic, switching threshold.',
    prerequisites: ['pn_junction_diode', 'boolean_algebra_logic_gates'],
    keywords: ['CMOS', 'inverter', 'NMOS', 'PMOS', 'VTC', 'switching threshold'],
    complexity: 7,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'vlsi_design', subject_label: 'VLSI Design',
    topic: 'Verilog HDL Basics',
    topic_slug: 'verilog_basics',
    description: 'Module structure, port declaration, data types, basic syntax.',
    prerequisites: ['boolean_algebra_logic_gates', 'sequential_logic_flip_flops'],
    keywords: ['verilog', 'module', 'port', 'wire', 'reg', 'data type'],
    complexity: 6,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'vlsi_design', subject_label: 'VLSI Design',
    topic: 'Verilog Blocking vs Non-Blocking Assignment',
    topic_slug: 'verilog_blocking_nonblocking',
    description: 'Difference between = and <= operators, sequential vs combinational logic implications.',
    prerequisites: ['verilog_basics', 'sequential_logic_flip_flops'],
    keywords: ['blocking', 'non-blocking', 'always block', 'sequential', 'combinational'],
    complexity: 8,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'vlsi_design', subject_label: 'VLSI Design',
    topic: 'Finite State Machine Design in Verilog',
    topic_slug: 'fsm_verilog',
    description: 'Moore and Mealy machine implementation, state encoding strategies.',
    prerequisites: ['verilog_blocking_nonblocking', 'sequential_logic_flip_flops'],
    keywords: ['FSM', 'moore machine', 'mealy machine', 'state encoding', 'state diagram'],
    complexity: 8,
    co_po_mapping: ['CO4-PO1', 'CO4-PO2', 'CO4-PO3'],
  },
  {
    year: 3, semester: 5,
    subject: 'vlsi_design', subject_label: 'VLSI Design',
    topic: 'Synthesis and Timing Constraints',
    topic_slug: 'synthesis_timing_constraints',
    description: 'Static timing analysis, setup/hold time, synthesis tool flow.',
    prerequisites: ['verilog_blocking_nonblocking', 'fsm_verilog'],
    keywords: ['synthesis', 'timing constraint', 'setup time', 'hold time', 'STA'],
    complexity: 9,
    co_po_mapping: ['CO4-PO1', 'CO4-PO2', 'CO4-PO3'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 5 — Microprocessors and Microcontrollers
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 5,
    subject: 'microprocessors_and_microcontrollers', subject_label: 'Microprocessors & Microcontrollers',
    topic: '8086 Architecture and Addressing Modes',
    topic_slug: '8086_architecture_addressing',
    description: 'Register organization, segmented memory, addressing mode types.',
    prerequisites: ['microcontroller_architecture_overview'],
    keywords: ['8086', 'addressing mode', 'segment register', 'memory model'],
    complexity: 6,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'microprocessors_and_microcontrollers', subject_label: 'Microprocessors & Microcontrollers',
    topic: 'Interfacing — ADC and DAC',
    topic_slug: 'interfacing_adc_dac',
    description: 'Analog to digital and digital to analog conversion interfacing.',
    prerequisites: ['8086_architecture_addressing', 'gpio_digital_io'],
    keywords: ['ADC', 'DAC', 'interfacing', 'conversion', 'resolution'],
    complexity: 6,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 5 — Control Systems
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 5,
    subject: 'control_systems', subject_label: 'Control Systems',
    topic: 'Transfer Function and Block Diagram Reduction',
    topic_slug: 'transfer_function_block_diagram',
    description: 'System representation via transfer function, block diagram simplification rules.',
    prerequisites: ['laplace_transform_fundamentals'],
    keywords: ['transfer function', 'block diagram', 'reduction', 'feedback'],
    complexity: 6,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'control_systems', subject_label: 'Control Systems',
    topic: 'Stability Analysis — Routh-Hurwitz Criterion',
    topic_slug: 'routh_hurwitz_stability',
    description: 'Determining system stability from characteristic equation coefficients.',
    prerequisites: ['transfer_function_block_diagram'],
    keywords: ['routh hurwitz', 'stability', 'characteristic equation', 'poles'],
    complexity: 7,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 3, semester: 5,
    subject: 'control_systems', subject_label: 'Control Systems',
    topic: 'Root Locus Technique',
    topic_slug: 'root_locus_technique',
    description: 'Graphical method showing pole locations as system gain varies.',
    prerequisites: ['routh_hurwitz_stability'],
    keywords: ['root locus', 'gain', 'pole', 'breakaway point'],
    complexity: 8,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 6 — Digital Signal Processing
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 6,
    subject: 'digital_signal_processing', subject_label: 'Digital Signal Processing',
    topic: 'Z-Transform and Region of Convergence',
    topic_slug: 'z_transform_roc',
    description: 'Discrete-time equivalent of Laplace transform, ROC determination.',
    prerequisites: ['laplace_transform_fundamentals', 'sampling_theorem'],
    keywords: ['z-transform', 'ROC', 'region of convergence', 'poles', 'zeros'],
    complexity: 7,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'digital_signal_processing', subject_label: 'Digital Signal Processing',
    topic: 'Z-Transform Stability Analysis',
    topic_slug: 'z_transform_stability',
    description: 'Pole location relative to unit circle determines system stability.',
    prerequisites: ['z_transform_roc', 'routh_hurwitz_stability'],
    keywords: ['z-transform stability', 'unit circle', 'poles', 'causal system'],
    complexity: 8,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'digital_signal_processing', subject_label: 'Digital Signal Processing',
    topic: 'DFT and FFT Algorithms',
    topic_slug: 'dft_fft_algorithms',
    description: 'Discrete Fourier Transform computation, Fast Fourier Transform efficiency.',
    prerequisites: ['z_transform_roc', 'convolution_lti_systems'],
    keywords: ['DFT', 'FFT', 'butterfly', 'radix-2', 'computational complexity'],
    complexity: 8,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2', 'CO3-PO3'],
  },
  {
    year: 3, semester: 6,
    subject: 'digital_signal_processing', subject_label: 'Digital Signal Processing',
    topic: 'FIR and IIR Filter Design',
    topic_slug: 'fir_iir_filter_design',
    description: 'Finite and infinite impulse response filter design methods.',
    prerequisites: ['dft_fft_algorithms', 'convolution_lti_systems'],
    keywords: ['FIR filter', 'IIR filter', 'impulse response', 'filter design'],
    complexity: 8,
    co_po_mapping: ['CO4-PO1', 'CO4-PO2', 'CO4-PO3'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 6 — Analog and Digital Communication
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 6,
    subject: 'analog_and_digital_communication', subject_label: 'Analog & Digital Communication',
    topic: 'Amplitude Modulation Fundamentals',
    topic_slug: 'amplitude_modulation',
    description: 'AM signal generation, modulation index, sideband analysis.',
    prerequisites: ['continuous_discrete_time_signals'],
    keywords: ['amplitude modulation', 'modulation index', 'sideband', 'carrier'],
    complexity: 5,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'analog_and_digital_communication', subject_label: 'Analog & Digital Communication',
    topic: 'Frequency Modulation and Bandwidth',
    topic_slug: 'frequency_modulation',
    description: "FM signal characteristics, Carson's rule for bandwidth estimation.",
    prerequisites: ['amplitude_modulation'],
    keywords: ['frequency modulation', 'carsons rule', 'bandwidth', 'deviation'],
    complexity: 6,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'analog_and_digital_communication', subject_label: 'Analog & Digital Communication',
    topic: 'Digital Modulation — ASK, FSK, PSK',
    topic_slug: 'digital_modulation_ask_fsk_psk',
    description: 'Digital carrier modulation techniques and their spectral characteristics.',
    prerequisites: ['frequency_modulation', 'sampling_theorem'],
    keywords: ['ASK', 'FSK', 'PSK', 'digital modulation', 'constellation'],
    complexity: 7,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'analog_and_digital_communication', subject_label: 'Analog & Digital Communication',
    topic: 'Sampling and Quantization — PCM',
    topic_slug: 'sampling_quantization_pcm',
    description: 'Pulse code modulation, quantization error, bit rate calculation.',
    prerequisites: ['sampling_theorem', 'digital_modulation_ask_fsk_psk'],
    keywords: ['PCM', 'quantization', 'sampling', 'bit rate', 'quantization error'],
    complexity: 7,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 3, SEMESTER 6 — Electromagnetic Field Theory
  // ══════════════════════════════════════════════════
  {
    year: 3, semester: 6,
    subject: 'electromagnetic_field_theory', subject_label: 'Electromagnetic Field Theory',
    topic: "Maxwell's Equations",
    topic_slug: 'maxwells_equations',
    description: 'Four fundamental equations governing electric and magnetic field behavior.',
    prerequisites: ['ac_fundamentals_rms_peak'],
    keywords: ['maxwells equations', 'electric field', 'magnetic field', 'divergence', 'curl'],
    complexity: 8,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 3, semester: 6,
    subject: 'electromagnetic_field_theory', subject_label: 'Electromagnetic Field Theory',
    topic: 'Transmission Line Theory',
    topic_slug: 'transmission_line_theory',
    description: 'Characteristic impedance, reflection coefficient, standing wave ratio.',
    prerequisites: ['maxwells_equations'],
    keywords: ['transmission line', 'characteristic impedance', 'VSWR', 'reflection coefficient'],
    complexity: 8,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 4, SEMESTER 7 — Wireless and Mobile Communication
  // ══════════════════════════════════════════════════
  {
    year: 4, semester: 7,
    subject: 'wireless_and_mobile_communication', subject_label: 'Wireless & Mobile Communication',
    topic: 'Cellular Concepts and Frequency Reuse',
    topic_slug: 'cellular_frequency_reuse',
    description: 'Cell structure, frequency reuse factor, co-channel interference.',
    prerequisites: ['digital_modulation_ask_fsk_psk'],
    keywords: ['cellular', 'frequency reuse', 'co-channel interference', 'cluster'],
    complexity: 7,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2'],
  },
  {
    year: 4, semester: 7,
    subject: 'wireless_and_mobile_communication', subject_label: 'Wireless & Mobile Communication',
    topic: 'OFDM Fundamentals',
    topic_slug: 'ofdm_basics',
    description: 'Orthogonal frequency division multiplexing, subcarrier orthogonality principle.',
    prerequisites: ['digital_modulation_ask_fsk_psk', 'dft_fft_algorithms'],
    keywords: ['OFDM', 'subcarrier', 'orthogonality', 'multicarrier'],
    complexity: 8,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2', 'CO2-PO3'],
  },
  {
    year: 4, semester: 7,
    subject: 'wireless_and_mobile_communication', subject_label: 'Wireless & Mobile Communication',
    topic: 'OFDM Cyclic Prefix',
    topic_slug: 'ofdm_cyclic_prefix',
    description: 'Guard interval appended to OFDM symbol to eliminate inter-symbol interference from multipath.',
    prerequisites: ['ofdm_basics'],
    keywords: ['cyclic prefix', 'ISI', 'guard interval', 'multipath', 'spectral efficiency'],
    complexity: 9,
    co_po_mapping: ['CO3-PO1', 'CO3-PO2', 'CO3-PO3'],
  },
  {
    year: 4, semester: 7,
    subject: 'wireless_and_mobile_communication', subject_label: 'Wireless & Mobile Communication',
    topic: 'MIMO Systems',
    topic_slug: 'mimo_systems',
    description: 'Multiple input multiple output antenna systems, spatial diversity and multiplexing.',
    prerequisites: ['ofdm_basics', 'transmission_line_theory'],
    keywords: ['MIMO', 'spatial diversity', 'spatial multiplexing', 'antenna array'],
    complexity: 9,
    co_po_mapping: ['CO4-PO1', 'CO4-PO2', 'CO4-PO3'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 4, SEMESTER 7 — VLSI Design Lab (Advanced)
  // ══════════════════════════════════════════════════
  {
    year: 4, semester: 7,
    subject: 'vlsi_design_lab_advanced', subject_label: 'VLSI Design Lab (Advanced)',
    topic: 'Low Power VLSI Design Techniques',
    topic_slug: 'low_power_vlsi_design',
    description: 'Clock gating, power gating, dynamic voltage scaling for power reduction.',
    prerequisites: ['synthesis_timing_constraints', 'cmos_inverter_characteristics'],
    keywords: ['low power', 'clock gating', 'power gating', 'dynamic voltage scaling'],
    complexity: 9,
    co_po_mapping: ['CO1-PO1', 'CO1-PO2', 'CO1-PO3'],
  },
  {
    year: 4, semester: 7,
    subject: 'vlsi_design_lab_advanced', subject_label: 'VLSI Design Lab (Advanced)',
    topic: 'ASIC Design Flow',
    topic_slug: 'asic_design_flow',
    description: 'Front-end to back-end design flow, place and route fundamentals.',
    prerequisites: ['synthesis_timing_constraints'],
    keywords: ['ASIC', 'design flow', 'place and route', 'floorplanning'],
    complexity: 9,
    co_po_mapping: ['CO2-PO1', 'CO2-PO2', 'CO2-PO3'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 4, SEMESTER 8 — IoT and Embedded Systems Project
  // ══════════════════════════════════════════════════
  {
    year: 4, semester: 8,
    subject: 'iot_and_industry_4', subject_label: 'IoT & Industry 4.0',
    topic: 'ESP32 WiFi/BLE Connectivity',
    topic_slug: 'esp32_wifi_ble',
    description: 'Wireless connectivity setup, BLE advertising, WiFi station/AP mode.',
    prerequisites: ['uart_serial_communication', 'timer_interrupt_configuration'],
    keywords: ['ESP32', 'WiFi', 'BLE', 'advertising', 'station mode', 'AP mode'],
    complexity: 7,
    co_po_mapping: ['CO1-PO2', 'CO1-PO3'],
  },
  {
    year: 4, semester: 8,
    subject: 'iot_and_industry_4', subject_label: 'IoT & Industry 4.0',
    topic: 'MQTT Protocol for IoT',
    topic_slug: 'mqtt_protocol_iot',
    description: 'Publish-subscribe messaging protocol for constrained IoT devices.',
    prerequisites: ['esp32_wifi_ble'],
    keywords: ['MQTT', 'publish subscribe', 'broker', 'topic', 'QoS'],
    complexity: 7,
    co_po_mapping: ['CO2-PO2', 'CO2-PO3'],
  },
  {
    year: 4, semester: 8,
    subject: 'iot_and_industry_4', subject_label: 'IoT & Industry 4.0',
    topic: 'Edge AI Deployment on Microcontrollers',
    topic_slug: 'edge_ai_microcontrollers',
    description: 'TinyML model deployment constraints, quantization for embedded inference.',
    prerequisites: ['esp32_wifi_ble', 'gpio_digital_io'],
    keywords: ['TinyML', 'edge AI', 'quantization', 'embedded inference', 'model size'],
    complexity: 9,
    co_po_mapping: ['CO3-PO2', 'CO3-PO3', 'CO3-PO5'],
  },

  // ══════════════════════════════════════════════════
  // YEAR 4, SEMESTER 8 — Major Project / Capstone
  // ══════════════════════════════════════════════════
  {
    year: 4, semester: 8,
    subject: 'final_year_project', subject_label: 'Final Year Project',
    topic: 'Literature Survey Methodology',
    topic_slug: 'literature_survey_methodology',
    description: 'Systematic review of existing work, identifying research gaps.',
    prerequisites: [],
    keywords: ['literature survey', 'research gap', 'citation', 'systematic review'],
    complexity: 6,
    co_po_mapping: ['CO1-PO3', 'CO1-PO5'],
  },
  {
    year: 4, semester: 8,
    subject: 'final_year_project', subject_label: 'Final Year Project',
    topic: 'System Design Documentation',
    topic_slug: 'system_design_documentation',
    description: 'Block diagrams, requirement specification, design justification.',
    prerequisites: ['literature_survey_methodology'],
    keywords: ['system design', 'block diagram', 'requirement specification'],
    complexity: 6,
    co_po_mapping: ['CO2-PO3', 'CO2-PO5'],
  },
  {
    year: 4, semester: 8,
    subject: 'final_year_project', subject_label: 'Final Year Project',
    topic: 'Project Novelty and IP Considerations',
    topic_slug: 'project_novelty_ip',
    description: 'Identifying patentable contributions, prior art comparison.',
    prerequisites: ['literature_survey_methodology', 'system_design_documentation'],
    keywords: ['novelty', 'patent', 'prior art', 'IP', 'contribution'],
    complexity: 8,
    co_po_mapping: ['CO3-PO3', 'CO3-PO5', 'CO3-PO12'],
  },
];

// Validate that all prerequisite slugs exist in SYLLABUS
export function validatePrerequisites(): string[] {
  const allSlugs = new Set(SYLLABUS.map(t => t.topic_slug));
  const errors: string[] = [];
  for (const topic of SYLLABUS) {
    for (const prereq of topic.prerequisites) {
      if (!allSlugs.has(prereq)) {
        errors.push(`Topic "${topic.topic_slug}" has invalid prerequisite: "${prereq}"`);
      }
    }
  }
  return errors;
}
