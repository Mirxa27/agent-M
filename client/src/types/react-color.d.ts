declare module "react-color" {
  import { ComponentType } from "react";

  export interface ColorResult {
    hex: string;
    rgb: {
      r: number;
      g: number;
      b: number;
      a?: number;
    };
    hsl: {
      h: number;
      s: number;
      l: number;
      a?: number;
    };
  }

  export interface ColorPickerProps {
    color?:
      | string
      | {
          r: number;
          g: number;
          b: number;
          a?: number;
        }
      | {
          h: number;
          s: number;
          l: number;
          a?: number;
        };
    onChange?: (color: ColorResult) => void;
    onChangeComplete?: (color: ColorResult) => void;
    className?: string;
    style?: React.CSSProperties;
    width?: string | number;
    height?: string | number;
    disableAlpha?: boolean;
    presetColors?: string[];
    renderers?: any;
    triangle?: "hide" | "top-left" | "top-right";
  }

  export const AlphaPicker: ComponentType<ColorPickerProps>;
  export const BlockPicker: ComponentType<ColorPickerProps>;
  export const ChromePicker: ComponentType<ColorPickerProps>;
  export const CirclePicker: ComponentType<ColorPickerProps>;
  export const CompactPicker: ComponentType<ColorPickerProps>;
  export const GithubPicker: ComponentType<ColorPickerProps>;
  export const HuePicker: ComponentType<ColorPickerProps>;
  export const MaterialPicker: ComponentType<ColorPickerProps>;
  export const PhotoshopPicker: ComponentType<ColorPickerProps>;
  export const SketchPicker: ComponentType<ColorPickerProps>;
  export const SliderPicker: ComponentType<ColorPickerProps>;
  export const SwatchesPicker: ComponentType<ColorPickerProps>;
  export const TwitterPicker: ComponentType<ColorPickerProps>;
}
