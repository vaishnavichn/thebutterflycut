import { Case, Clue } from './types';

export const INITIAL_CLUES: { [caseId: number]: Clue[] } = {
  1: [
    {
      id: 'c1_vault_log',
      title: 'Vault Biometric Log',
      description: "The vault's biometric log shows the child badged in at 2:47 AM, consistent with their known nightly habit of viewing the painting before bed.",
      sourceTile: 'Vault',
      isDiscovered: false,
    },
    {
      id: 'c1_sensor_bypass',
      title: 'Sensor Bypass Log',
      description: "Head_Security's badge shows he disabled the west wing motion sensors at 2:50 AM, logged as 'routine maintenance check.'",
      sourceTile: 'Security Booth',
      isDiscovered: false,
    },
    {
      id: 'c1_sophisticated_forgery',
      title: 'The Sophisticated Forgery',
      description: "The forgery was later found to be a canvas-and-pigment match requiring weeks of preparation, suggesting the swap was planned before the exclusive viewing was even announced.",
      sourceTile: 'West Wing',
      isDiscovered: false,
    },
    {
      id: 'c1_cleaner_log',
      title: 'Cleaner Shift Log',
      description: "Night_Cleaner's shift log places her in the east wing, on the opposite side of the building, from 2:30 AM to 3:15 AM.",
      sourceTile: 'East Wing',
      isDiscovered: false,
    },
    {
      id: 'c1_signout_sheet',
      title: 'Front Desk Sign-out Sheet',
      description: "Gallery_Curator left the building at 11:00 PM according to the front desk sign-out sheet, before the vault was even sealed for the night.",
      sourceTile: 'Front Desk',
      isDiscovered: false,
    },
    {
      id: 'c1_nanny_calls',
      title: 'Nanny Call Records',
      description: "Family_Nanny was on a phone call with the family's driver from 2:45 AM to 3:05 AM, confirmed by call records.",
      sourceTile: 'Break Room',
      isDiscovered: false,
    },
    {
      id: 'c1_medical_report',
      title: 'Medical Report on Child',
      description: "The child was found with a minor bump to the head and no other injuries, consistent with being pushed rather than deliberately struck.",
      sourceTile: 'Storage Room',
      isDiscovered: false,
    },
    {
      id: 'c1_collector_offer',
      title: 'Art Collector Offer Letter',
      description: "A private art collector, previously rejected by the family for a purchase offer on the painting, is known to operate through intermediaries in the black market art trade.",
      sourceTile: "Curator's Office",
      isDiscovered: false,
    }
  ],
  2: [
    {
      id: 'c2_bank_routing',
      title: 'Rival Firm Routing Number',
      description: 'A handwritten paper scrap found in Dr. Aris\'s desk showing a $500,000 pending wire transfer from a rival corporation.',
      sourceTile: 'Aris\'s Locker',
      isDiscovered: false,
    },
    {
      id: 'c2_empty_logs',
      title: 'Silent Imaging Logs',
      description: 'The neural scanner console confirms that no patient scans were processed during Dr. Helena\'s night shift, contrary to her alibi.',
      sourceTile: 'Neural Scanner',
      isDiscovered: false,
    },
    {
      id: 'c2_barcode_canister',
      title: 'Courier Barcoded Canister',
      description: 'A contaminated biohazard canister discarded near the liquid nitrogen tanks, stamped with Courier Jax\'s unique employee barcode.',
      sourceTile: 'Liquid Nitro Tank',
      isDiscovered: false,
    }
  ],
  3: [
    {
      id: 'c3_gala_receipt',
      title: 'Early Exit Gala Receipt',
      description: 'An expensive valet receipt from a private club proving CEO Vance checked out from the shareholder gala at 7:30 PM, two hours before it ended.',
      sourceTile: 'CEO Mahogany Desk',
      isDiscovered: false,
    },
    {
      id: 'c3_transit_timestamp',
      title: 'Late Transit Swivel',
      description: 'Penelope\'s transit card wasn\'t swiped at the subway station until 9:00 PM, leaving a suspicious 4-hour gap from her claimed 5:00 PM exit.',
      sourceTile: 'Penelope\'s Phone',
      isDiscovered: false,
    },
    {
      id: 'c3_disconnected_wire',
      title: 'Severed Camera Cable',
      description: 'A physically cut power wire behind the basement archive server, manually severed from the inside with high-precision wire cutters.',
      sourceTile: 'Server Switch',
      isDiscovered: false,
    }
  ],
  4: [
    {
      id: 'c4_locked_door',
      title: 'Dish Platform Access Log',
      description: 'Electronic locks show the outer Dish Platform door was never opened all night, proving Dr. Raymond could not have been outside calibrating dishes.',
      sourceTile: 'Dishes Platform',
      isDiscovered: false,
    },
    {
      id: 'c4_clara_usb',
      title: 'Clara\'s custom USB Drive',
      description: 'A high-speed transmitter USB drive found plugged into the backup transmitter port, containing Specialist Clara\'s digital signature.',
      sourceTile: 'Main Terminal',
      isDiscovered: false,
    },
    {
      id: 'c4_generator_log',
      title: 'Untouched Generator Seals',
      description: 'The backup generator security seals are fully intact. The engine diagnostic logs show continuous, undisturbed automatic operation with zero manual overrides.',
      sourceTile: 'Backup Generator',
      isDiscovered: false,
    }
  ],
  5: [
    {
      id: 'c5_resin_polish',
      title: 'Specialized Replica Resin',
      description: 'Traces of a rare micro-crystalline UV-resin polish, exclusively imported by Curator Julian for artifact preservation, found on the counterfeit 3D scarab.',
      sourceTile: 'Onyx Pedestal',
      isDiscovered: false,
    },
    {
      id: 'c5_slicer_cache',
      title: '3D Printer Slicer Cache',
      description: 'The 3D printer\'s local cache memory holds a highly detailed, 12-million-polygon laser scan file of the Onyx Scarab, loaded from Sofia\'s workstation.',
      sourceTile: '3D Printer Lab',
      isDiscovered: false,
    },
    {
      id: 'c5_sensor_override',
      title: 'Console Sensor Override',
      description: 'The master security ledger reveals the west corridor motion sensors were bypassed at 1:12 AM using Officer Marcus\'s personal clearance code.',
      sourceTile: 'Marcus\'s Console',
      isDiscovered: false,
    }
  ]
};

export const getInitialCases = (): Case[] => [
  {
    id: 1,
    title: 'The Midnight Serenade',
    description: "The Lumina Gallery — a prestigious private art gallery hosting a single-night exclusive viewing of the masterpiece 'Midnight Serenade,' on loan from a wealthy, reclusive family.",
    baselineScene: 'The private viewing vault. The air smells of wet paint, high-end lacquer, and ozone. Spotlight beams focus on an empty velvet pedestal where the masterpiece was secured. In the adjacent storage room, a child lies unconscious.',
    initialNarrative: "At 3:00 AM, gallery security alarms triggered in the private viewing vault. The masterpiece 'Midnight Serenade' was found replaced by a forgery so sophisticated it didn't flag the scanners. In the adjacent storage room, the owner's young child was found unconscious. The security system was bypassed from the inside.",
    solved: false,
    suspects: [
      {
        id: 'curator',
        name: 'Eleanor Voss',
        role: 'Gallery Curator',
        alibi: 'I left the building at 11:00 PM according to the front desk sign-out sheet, before the vault was even sealed for the night.',
        secret: 'She is terrified of professional ruin and came back at 1:00 AM to fetch her forgotten planner, but she insists she was home all night.',
        contradiction: 'She insists she was home all night after 11 PM, but she is highly defensive and hiding her brief middle-of-the-night return.',
        contradictionTrigger: 'Front Desk Sign-out Sheet',
        isCulprit: false,
        persona: 'Poised and image-conscious, deeply protective of the gallery\'s reputation. Answers precisely but grows defensive if her professional competence is questioned. Genuinely alibied but anxious about how the scandal reflects on her.',
      },
      {
        id: 'cleaner',
        name: 'Rosa Delgado',
        role: 'Night Cleaner',
        alibi: 'I was cleaning the east wing, on the opposite side of the building, from 2:30 AM to 3:15 AM.',
        secret: 'She found a discarded prototype frame in the east wing trash and took it, fearing she would be blamed for stealing.',
        contradiction: 'Her shift log places her in the east wing during the heist, confirming she had no access to the vault.',
        contradictionTrigger: 'Cleaner Shift Log',
        isCulprit: false,
        persona: 'Tired, plainspoken, slightly suspicious of authority figures questioning her. Answers in short, factual sentences. Has nothing to hide but resents being treated as a default suspect because of her job.',
      },
      {
        id: 'nanny',
        name: 'Priya Kapoor',
        role: 'Family Nanny',
        alibi: "I was on a phone call with the family's driver from 2:45 AM to 3:05 AM, confirmed by call records.",
        secret: 'She fell asleep for 10 minutes before her phone call and feels immense guilt for leaving the child unattended.',
        contradiction: 'Her phone call records confirm her alibi during the exact time of the alarm.',
        contradictionTrigger: 'Nanny Call Records',
        isCulprit: false,
        persona: 'Visibly shaken and guilt-ridden about the child\'s injury, even though she\'s not responsible. Emotional, protective of the child, eager to help but occasionally rambles from distress.',
      },
      {
        id: 'security',
        name: 'Marcus Reyes',
        role: 'Head of Security',
        alibi: 'I was in the security booth monitoring cameras all night, except for a routine maintenance check of the west wing.',
        secret: 'He was bribed by a private art collector to swap the painting for a forgery, and used the child\'s routine vault visit as cover. When the child startled him, he pushed and restrained them to avoid discovery.',
        contradiction: 'His badge log reveals he disabled the west wing motion sensors at 2:50 AM, right before the heist, contradicting a standard non-disabling patrol.',
        contradictionTrigger: 'Sensor Bypass Log',
        isCulprit: true, // Actual culprit
        persona: 'Calm, procedural, uses security-jargon to sound authoritative and above suspicion. Subtly redirects questions toward \'reviewing the footage\' or \'protocol\' rather than giving direct answers. Never visibly nervous — this is the tell, if the player notices how controlled he is compared to the others.',
      }
    ],
    roomMatrix: [
      [
        { id: 't1_1', name: 'Vault', description: 'The private viewing vault where "Midnight Serenade" was kept. A high-fidelity copy of the painting hangs in place of the original. The biometric log sits on a terminal.', hasClue: true, clueId: 'c1_vault_log', isInspected: false },
        { id: 't1_2', name: 'Storage Room', description: 'Adjacent to the vault. Empty crates, canvases, and restoration tools. A small medical report about the child\'s minor head injury is left on a desk.', hasClue: true, clueId: 'c1_medical_report', isInspected: false },
        { id: 't1_3', name: 'Security Booth', description: 'The room with CCTV feeds and sensor logs. A security system report details sensor activity in the west wing.', hasClue: true, clueId: 'c1_sensor_bypass', isInspected: false }
      ],
      [
        { id: 't1_4', name: 'Front Desk', description: 'The main lobby counter. The paper front-desk sign-out log contains Eleanor Voss\'s signature at 11:00 PM.', hasClue: true, clueId: 'c1_signout_sheet', isInspected: false },
        { id: 't1_5', name: 'East Wing', description: 'A long corridor displaying Renaissance sketches. The electronic shift log on the wall places Rosa Delgado here between 2:30 AM and 3:15 AM.', hasClue: true, clueId: 'c1_cleaner_log', isInspected: false },
        { id: 't1_6', name: 'West Wing', description: 'The wing containing the vault. Security lights flicker. A sensor log shows the motion detectors were deactivated at 2:50 AM.', hasClue: true, clueId: 'c1_sophisticated_forgery', isInspected: false }
      ],
      [
        { id: 't1_7', name: 'Curator\'s Office', description: 'An elegant office with antique bookshelves. A rejected purchase offer letter from a notorious art collector lies on the desk.', hasClue: true, clueId: 'c1_collector_offer', isInspected: false },
        { id: 't1_8', name: 'Break Room', description: 'A cozy employee break room with coffee machines. A cell phone log matching Priya Kapoor\'s calls is left on a table.', hasClue: true, clueId: 'c1_nanny_calls', isInspected: false },
        { id: 't1_9', name: 'Main Hall', description: 'The grand exhibition hall. Statues cast long shadows across the polished marble floor. A visitor guide explains the layout.', hasClue: false, isInspected: false }
      ]
    ]
  },
  {
    id: 2,
    title: 'The Stolen Neural Core',
    description: 'A state-of-the-art bio-tech facility reports its next-generation neural interface core has been extracted from a sub-zero containment vault.',
    baselineScene: 'The Bio-Tech Lab. Mist rises from cold-nitrogen tanks. Fluorescent blue light panels illuminate expensive medical imaging equipment and heavy security vault gates.',
    initialNarrative: 'At 2:00 AM, the containment vessel pressure plummeted. Someone bypassed the sub-zero lock, removed the raw silicon neural core, and replaced it with an inactive dummy. The suspects: Dr. Aris, the Lead Scientist; Dr. Helena, the Neurologist; and Jax, the overnight delivery courier.',
    solved: false,
    suspects: [
      {
        id: 'aris',
        name: 'Dr. Aris',
        role: 'Lead Scientist',
        alibi: 'I was in my personal office reviewing the latest cognitive research papers.',
        secret: 'He has massive debts and has been negotiating an IP sale to competitors.',
        contradiction: 'A wire routing document shows an active $500k deposit coming from a competitor company.',
        contradictionTrigger: 'Rival Firm Routing Number',
        isCulprit: true,
      },
      {
        id: 'helena',
        name: 'Dr. Helena',
        role: 'Neurologist',
        alibi: 'I was monitoring clinical scans in the imaging bay during the event.',
        secret: 'She was suffering from severe migraines and secretly self-dosed with experimental drugs.',
        contradiction: 'The imaging logs show the scanner sat completely inactive all night.',
        contradictionTrigger: 'Silent Imaging Logs',
        isCulprit: false,
      },
      {
        id: 'jax',
        name: 'Courier Jax',
        role: 'Cargo Transport',
        alibi: 'I was waiting at the loading dock for the transit container to be sterilized.',
        secret: 'He is an illegal street racer who used a stolen ID card to access the labs.',
        contradiction: 'His barcode-marked containment canister was found deep in the laboratory area.',
        contradictionTrigger: 'Courier Barcoded Canister',
        isCulprit: false,
      }
    ],
    roomMatrix: [
      [
        { id: 't2_1', name: 'Liquid Nitro Tank', description: 'The sub-zero cryogenic chamber where the Neural Core was housed. A heavy canister with a transport barcode lies on the floor.', hasClue: true, clueId: 'c2_barcode_canister', isInspected: false },
        { id: 't2_2', name: 'Lab Bench', description: 'Covered in microscopes and slides. A small beaker of stabilizer solution is still warm.', hasClue: false, isInspected: false },
        { id: 't2_3', name: 'Decon Chamber', description: 'A highly sealed airlock room. No alarms were triggered, indicating the thief had authorized clearance.', hasClue: false, isInspected: false }
      ],
      [
        { id: 't2_4', name: 'Neural Scanner', description: 'A colossal MRI-like scanner. The terminal screen shows a blinking scan prompt. The history log is blank for tonight.', hasClue: true, clueId: 'c2_empty_logs', isInspected: false },
        { id: 't2_5', name: 'Helena\'s Desk', description: 'A neat desk with anatomical charts. A packet of unauthorized brain stimulants is buried in the drawer.', hasClue: false, isInspected: false },
        { id: 't2_6', name: 'Vault Gate', description: 'The physical gate separating the lab. It requires an authorization key from Aris or Helena.', hasClue: false, isInspected: false }
      ],
      [
        { id: 't2_7', name: 'Biohazard Bin', description: 'A yellow plastic bin. Inside is a torn rubber glove stained with conductive silicone grease.', hasClue: false, isInspected: false },
        { id: 't2_8', name: 'Aris\'s Locker', description: 'A metal locker with Dr. Aris\'s nameplate. Tucked inside a notebook is a piece of paper with wire transfer routing details.', hasClue: true, clueId: 'c2_bank_routing', isInspected: false },
        { id: 't2_9', name: 'Loading Dock', description: 'The cargo gate where Jax was stationed. Tire marks indicate a vehicle left rapidly around 2:05 AM.', hasClue: false, isInspected: false }
      ]
    ]
  },
  {
    id: 3,
    title: 'The Crimson Ledger',
    description: 'An offshore accounting firm\'s primary paper ledger is found shredded and incinerated inside a metal canister in the executive suite.',
    baselineScene: 'The Executive Suite. Heavy mahogany panels, leather chairs, a cold fireplace, and a lingering scent of burnt high-grade paper and chemical acceleration.',
    initialNarrative: 'At 8:00 PM, the office smoke detectors briefly signaled an alarm before being manually bypassed. The legendary "Crimson Ledger," which detailed high-profile political bribes, was completely destroyed. The suspects are: CEO Vance; Admin Penelope; and Head Accountant Barry.',
    solved: false,
    suspects: [
      {
        id: 'vance',
        name: 'CEO Vance',
        role: 'Firm Owner',
        alibi: 'I was representing the firm at a prestigious shareholder dinner gala uptown.',
        secret: 'He was embezzling from the escrow fund and destroyed the papers to hide it.',
        contradiction: 'A valet parking receipt proves he left the gala hours before the shredding happened.',
        contradictionTrigger: 'Early Exit Gala Receipt',
        isCulprit: true,
      },
      {
        id: 'penelope',
        name: 'Admin Penelope',
        role: 'Secretary',
        alibi: 'I clocked out at 5:00 PM and took the metro straight back home.',
        secret: 'She secretly made digital copies of the ledger files to blackmail the CEO.',
        contradiction: 'Her metro pass ticket shows she didn\'t swipe in at the station until 9:00 PM.',
        contradictionTrigger: 'Late Transit Swivel',
        isCulprit: false,
      },
      {
        id: 'barry',
        name: 'Accountant Barry',
        role: 'Lead Ledger Clerk',
        alibi: 'I was in the basement archives cataloging historic folders.',
        secret: 'He was taking bribes to help Vance shred the files but felt guilty.',
        contradiction: 'The basement server switch shows a manual disconnect occurred from inside the room.',
        contradictionTrigger: 'Severed Camera Cable',
        isCulprit: false,
      }
    ],
    roomMatrix: [
      [
        { id: 't3_1', name: 'Shredder Bin', description: 'An industrial-strength paper shredder. Inside, micro-shredded paper fibers are mixed with kerosene.', hasClue: false, isInspected: false },
        { id: 't3_2', name: 'CEO Mahogany Desk', description: 'A massive dark desk. Hidden inside a hollow gold pen is a valet parking receipt from the uptown club.', hasClue: true, clueId: 'c3_gala_receipt', isInspected: false },
        { id: 't3_3', name: 'Fireplace', description: 'The hearth is filled with black soot and charred scraps. One unburnt scrap shows: "Acct: 9942 - Liquidated."', hasClue: false, isInspected: false }
      ],
      [
        { id: 't3_4', name: 'Filing Cabinet', description: 'A heavy metal drawer labeled "Confidential". The folder for "Crimson Escrows" is entirely empty.', hasClue: false, isInspected: false },
        { id: 't3_5', name: 'Barry\'s Calculator', description: 'An old electronic calculator. Its paper tape spool shows massive negative balances and ledger correction sums.', hasClue: false, isInspected: false },
        { id: 't3_6', name: 'Archive Shelf', description: 'Row after row of financial archives. Barry\'s reading glasses lie here, forgotten.', hasClue: false, isInspected: false }
      ],
      [
        { id: 't3_7', name: 'Penelope\'s Phone', description: 'Her phone sits on her desk, unlocked. A transit app notification warns of a late subway swipe at 9:00 PM.', hasClue: true, clueId: 'c3_transit_timestamp', isInspected: false },
        { id: 't3_8', name: 'Server Switch', description: 'The backup connection box. A severed blue ethernet cable dangling from the hub stopped the remote server backup logs.', hasClue: true, clueId: 'c3_disconnected_wire', isInspected: false },
        { id: 't3_9', name: 'Trash Chute', description: 'A metal trapdoor. Balled-up napkins inside smell like gasoline, the primary accelerant.', hasClue: false, isInspected: false }
      ]
    ]
  },
  {
    id: 4,
    title: 'The Phantom Signal',
    description: 'An astronomical station on a foggy cliff is caught transmitting a powerful, unauthorized radio beam into deep space.',
    baselineScene: 'The Signal Observatory. Console monitors flicker with fast-scrolling alien data streams. The giant mechanical telescope dishes outside creak in the salty wind.',
    initialNarrative: 'At 1:15 AM, the primary signal terminal executed an automated relay sequence, aiming the dishes at precise spatial coordinates. The astronomer claims it was a calibration routine, but military radars intercepted an encrypted terrestrial transmission. The suspects are: Dr. Raymond, Specialist Clara, and Operator George.',
    solved: false,
    suspects: [
      {
        id: 'raymond',
        name: 'Dr. Raymond',
        role: 'Lead Astronomer',
        alibi: 'I was outside on the dish platform adjusting the optical calibration mirrors.',
        secret: 'He is working with corporate spies to upload classified aerospace data.',
        contradiction: 'The electronic locks show the dish platform access door stayed closed all night.',
        contradictionTrigger: 'Dish Platform Access Log',
        isCulprit: true,
      },
      {
        id: 'clara',
        name: 'Specialist Clara',
        role: 'Communications Expert',
        alibi: 'I was asleep in the staff barracks after completing my midnight shift.',
        secret: 'She is running a side business hosting dark-web nodes on the telescope\'s servers.',
        contradiction: 'Her personal USB drive, complete with her encryption signature, was found in the signal terminal.',
        contradictionTrigger: 'Clara\'s custom USB Drive',
        isCulprit: false,
      },
      {
        id: 'george',
        name: 'Operator George',
        role: 'Maintenance Mechanic',
        alibi: 'I spent my entire shift in the basement crawling spaces repairing a faulty fuel generator.',
        secret: 'He is getting paid to look the other way when unusual cargo arrives at the coast.',
        contradiction: 'The generator log registers perfect efficiency with zero maintenance flags all night.',
        contradictionTrigger: 'Untouched Generator Seals',
        isCulprit: false,
      }
    ],
    roomMatrix: [
      [
        { id: 't4_1', name: 'Dishes Platform', description: 'The windy outer metal gangway. The heavy metal security door leading out is securely bolted and logged as "Closed."', hasClue: true, clueId: 'c4_locked_door', isInspected: false },
        { id: 't4_2', name: 'Main Terminal', description: 'The primary command console. A custom encryption USB drive is still plugged into the auxiliary storage port.', hasClue: true, clueId: 'c4_clara_usb', isInspected: false },
        { id: 't4_3', name: 'Backup Generator', description: 'The massive backup fuel generator. It is clean and cold. The electronic seals on the control panel are intact.', hasClue: true, clueId: 'c4_generator_log', isInspected: false }
      ],
      [
        { id: 't4_4', name: 'Clara\'s locker', description: 'Contains standard signal technician manuals and an empty packaging sleeve for a 256GB secure flash drive.', hasClue: false, isInspected: false },
        { id: 't4_5', name: 'Quarters Bed', description: 'The bunk beds. Clara\'s bed is made and cold to the touch, suggesting it wasn\'t slept in tonight.', hasClue: false, isInspected: false },
        { id: 't4_6', name: 'Signal Antenna', description: 'An indoor signal routing junction. Indicator lights show data routing to a nearby yacht anchored off the coast.', hasClue: false, isInspected: false }
      ],
      [
        { id: 't4_7', name: 'Raymond\'s Desk', description: 'A cluttered desk with stellar charts. A folded map shows the coordinates matching the exact signal beam angle.', hasClue: false, isInspected: false },
        { id: 't4_8', name: 'Tool Rack', description: 'Holds wrenches, calipers, and circuit testers. All items are meticulously organized.', hasClue: false, isInspected: false },
        { id: 't4_9', name: 'Server Tower', description: 'A mainframe computing rack. Its internal temperature is elevated, indicating heavy, sustained script execution.', hasClue: false, isInspected: false }
      ]
    ]
  },
  {
    id: 5,
    title: 'The Museum Artifact Swindle',
    description: 'The ancient Vault of Antiquities has been breached. A priceless onyx scarab was stolen and replaced with a high-fidelity copy.',
    baselineScene: 'The Antiquities Vault. Ambient spot lighting focuses on an empty velvet pedestal inside a shattered glass display case. The smell of plastic resin hangs in the silent gallery.',
    initialNarrative: 'At 1:00 AM, the museum\'s security grid experienced a brief 2-second bypass. When the morning guard arrived, the legendary Onyx Scarab looked odd. Chemical analysis revealed it was a 3D resin printed fake. The suspects: Curator Julian, exhibition designer Sofia, and guard Marcus.',
    solved: false,
    suspects: [
      {
        id: 'julian',
        name: 'Curator Julian',
        role: 'Antiquities Expert',
        alibi: 'I was in the reference library compiling our appraisal documentation all night.',
        secret: 'He has massive debts to art collectors and planned to fence the original scarab.',
        contradiction: 'The chemical signature of his specific appraisal UV-resin polish is present on the fake scarab.',
        contradictionTrigger: 'Specialized Replica Resin',
        isCulprit: true,
      },
      {
        id: 'sofia',
        name: 'Sofia',
        role: 'Exhibition Designer',
        alibi: 'I was working in the East Wing setting up lighting mounts.',
        secret: 'She is a talented resin replica artist who was coerced into modeling the 3D files.',
        contradiction: 'The local 3D printer slicing logs show her workstation exported the scarab laser scan files.',
        contradictionTrigger: '3D Printer Slicer Cache',
        isCulprit: false,
      },
      {
        id: 'marcus',
        name: 'Officer Marcus',
        role: 'Security Contractor',
        alibi: 'I was conducting my hourly manual patrols around the West Wing gates.',
        secret: 'He disabled the motion sensors in exchange for a cut of Sofia\'s artistic prints.',
        contradiction: 'The master security ledger confirms his credentials bypassed the vault alarm at 1:12 AM.',
        contradictionTrigger: 'Console Sensor Override',
        isCulprit: false,
      }
    ],
    roomMatrix: [
      [
        { id: 't5_1', name: 'Onyx Pedestal', description: 'The velvet display stand. The fake scarab feels warm, coated in a specific appraisal polish that glows under UV light.', hasClue: true, clueId: 'c5_resin_polish', isInspected: false },
        { id: 't5_2', name: '3D Printer Lab', description: 'The prototyping workshop. A high-grade industrial UV printer stands cool. Slicer logs show a scarab file accessed from Sofia\'s PC.', hasClue: true, clueId: 'c5_slicer_cache', isInspected: false },
        { id: 't5_3', name: 'Display Case', description: 'Shattered tempered glass. Strangely, the glass fell outward, indicating the showcase was blown open from the inside.', hasClue: false, isInspected: false }
      ],
      [
        { id: 't5_4', name: 'Julian\'s Desk', description: 'A desk stacked with old manuscripts. A magnifying glass sits on a letter from a private auction house offering millions for the scarab.', hasClue: false, isInspected: false },
        { id: 't5_5', name: 'East Wing Corridor', description: 'Clean marble floor. Sofia\'s portable ladder and laser measuring device are parked here.', hasClue: false, isInspected: false },
        { id: 't5_6', name: 'Marcus\'s Console', description: 'The local guard console. The security history logs reveal a bypass command executed using Marcus\'s ID card.', hasClue: true, clueId: 'c5_sensor_override', isInspected: false }
      ],
      [
        { id: 't5_7', name: 'Library Shelf', description: 'Tome-lined bookshelves. An open encyclopedia of Mesoamerican artifacts is resting on a reading table.', hasClue: false, isInspected: false },
        { id: 't5_8', name: 'West Corridor Gate', description: 'A heavy iron security gate. The gate lock mechanism shows no signs of physical tampering.', hasClue: false, isInspected: false },
        { id: 't5_9', name: 'Storage Chest', description: 'A wooden crate filled with bubble wrap and shipping packing sheets, stamped with the stamp of an art smuggler.', hasClue: false, isInspected: false }
      ]
    ]
  }
];
