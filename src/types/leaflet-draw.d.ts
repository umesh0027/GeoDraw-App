declare module "leaflet-draw" {
  import * as L from "leaflet";
  export = L;
}
declare namespace L {
  namespace Draw {
    class Polygon extends L.Draw.Feature {}
    class Rectangle extends L.Draw.Feature {}
    class Circle extends L.Draw.Feature {}
    class Polyline extends L.Draw.Feature {}
    const Event: any;
  }
}
