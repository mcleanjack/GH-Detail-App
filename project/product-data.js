// Product data for the Detail Viewer.
//
// Shape:
//   PRODUCT_DATA[<model key>] = {
//     default:    { …info fields }            // shown when nothing is selected
//     components: { "<component name>": {…} } // shown when that part is picked
//   }
//
// <model key>       matches MODELS[].code in the viewer (e.g. "CH-16").
// <component name>  matches a node name in the GLB scene graph. Matching is
//                   case/space/underscore-insensitive, so "Claw_Head", "claw head"
//                   and "ClawHead" all resolve to the same entry.
//
// Info fields (all optional except desc):
//   title     string  – overrides the panel heading for that component
//   desc      string  – description paragraph
//   specs     array   – [{ label, value }] rows
//   image     string  – URL shown above the description
//   supplier, host, slug, contact, phone, email – supplier block + link building
//
// Adding a new model = add one key here. No viewer code changes required.

window.PRODUCT_DATA = Object.assign({}, window.PRODUCT_DATA, {

  "CH-16": {
    default: {
      desc: "Forged-head claw hammer, 16 oz. Octagonal striking face with anti-shock composite grip; specified for framing and formwork fixing.",
      supplier: "Forgeline Tools Pty Ltd", host: "forgeline.example", slug: "ch16",
      contact: "Dana Whitcombe", phone: "+61 3 9663 2140", email: "d.whitcombe@forgeline.example"
    },
    components: {
      "Head": {
        title: "Forged Head",
        desc: "Drop-forged carbon steel head, octagonal in section with a milled striking face. Heat treated to 52 HRC and powder coated on the non-wearing faces.",
        specs: [
          { label: "Material", value: "AISI 1045" },
          { label: "Mass", value: "454 g" },
          { label: "Hardness", value: "52 HRC" }
        ],
        supplier: "Forgeline Tools Pty Ltd", host: "forgeline.example", slug: "ch16-head",
        contact: "Dana Whitcombe", phone: "+61 3 9663 2140", email: "d.whitcombe@forgeline.example"
      },
      "Shaft": {
        title: "Composite Shaft",
        desc: "Glass-filled nylon core over a steel spine, tapered toward the head eye. Overmoulded elastomer grip damps roughly 60% of transmitted shock.",
        specs: [
          { label: "Length", value: "330 mm" },
          { label: "Core", value: "GF nylon / steel" },
          { label: "Grip", value: "TPE overmould" }
        ],
        supplier: "Forgeline Tools Pty Ltd", host: "forgeline.example", slug: "ch16-shaft",
        contact: "Dana Whitcombe", phone: "+61 3 9663 2140", email: "d.whitcombe@forgeline.example"
      },
      "Wedge": {
        title: "Eye Wedge Collar",
        desc: "Epoxy-bedded steel wedge locking the shaft in the head eye. Torque checked at assembly; not field serviceable.",
        specs: [
          { label: "Fixing", value: "Epoxy bedded" },
          { label: "Service", value: "Factory only" }
        ],
        supplier: "Forgeline Tools Pty Ltd", host: "forgeline.example", slug: "ch16-wedge",
        contact: "Dana Whitcombe", phone: "+61 3 9663 2140", email: "d.whitcombe@forgeline.example"
      }
    }
  },

  "WT-440": {
    default: {
      desc: "Tiled balcony threshold over habitable space. Bonded sheet membrane returned up the door frame with a 150 mm upstand and drained cavity to the grate.",
      supplier: "Westline Building Systems", host: "westline.example", slug: "wt-440",
      contact: "Marcus Hale", phone: "+61 3 9412 7788", email: "m.hale@westline.example"
    },
    components: {}
  },

  "DJ-210": {
    default: {
      desc: "Hot-dip galvanised joist hanger for 90 mm framing. Fixed with 14 g \u00d7 35 connector screws, six per flange; suits exposed deck framing to H3 timber.",
      supplier: "Kelmore Structural Fixings", host: "kelmore.example", slug: "dj-210",
      contact: "Priya Raman", phone: "+61 3 9285 4410", email: "p.raman@kelmore.example"
    },
    components: {}
  },

  "BP-085": {
    default: {
      desc: "Core-drilled stainless post base with EPDM isolation collar. Rated for 0.75 kN/m handrail load; grout-filled after plumb alignment.",
      supplier: "Arden Metalworks", host: "ardenmetal.example", slug: "bp-085",
      contact: "Tom Ferris", phone: "+61 3 9736 1902", email: "t.ferris@ardenmetal.example"
    },
    components: {}
  },

  "WH-320": {
    default: {
      desc: "Pre-formed head flashing with 15 mm stop end and 5\u00b0 fall. Lapped over the wrap and taped to the frame before cladding installation.",
      supplier: "Coastline Cladding Co", host: "coastlinecladding.example", slug: "wh-320",
      contact: "Elise Nardone", phone: "+61 3 9550 6633", email: "e.nardone@coastlinecladding.example"
    },
    components: {}
  },

  "TD-115": {
    default: {
      desc: "Linear threshold grate, 115 mm wide, with removable stainless mesh insert. Falls 1:100 to the outlet; set 10 mm below finished tile level.",
      supplier: "Westline Building Systems", host: "westline.example", slug: "td-115",
      contact: "Marcus Hale", phone: "+61 3 9412 7788", email: "m.hale@westline.example"
    },
    components: {}
  }

});
