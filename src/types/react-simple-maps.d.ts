declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (event: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (event: { coordinates: [number, number]; zoom: number }) => void;
    onMoveEnd?: (event: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: Geography[] }) => ReactNode;
  }

  export interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: object;
  }

  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export interface LineProps {
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: "butt" | "round" | "square";
    strokeDasharray?: string;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }

  export interface AnnotationProps {
    subject: [number, number];
    dx?: number;
    dy?: number;
    curve?: number;
    connectorProps?: object;
    children?: ReactNode;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Line: ComponentType<LineProps>;
  export const Annotation: ComponentType<AnnotationProps>;
}
