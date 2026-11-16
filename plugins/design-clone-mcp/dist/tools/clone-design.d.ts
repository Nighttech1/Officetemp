/**
 * Clone Design Tool
 *
 * Uses Puppeteer to capture website design elements
 */
export interface DesignData {
    url: string;
    title: string;
    html: string;
    colors: string[];
    fonts: string[];
    sections: Section[];
    metadata: {
        capturedAt: string;
        viewport: {
            width: number;
            height: number;
        };
    };
}
export interface Section {
    tag: string;
    className: string;
    html: string;
    computedStyles: {
        backgroundColor: string;
        color: string;
        fontSize: string;
        fontFamily: string;
        padding: string;
        margin: string;
        display: string;
        width: string;
        height: string;
    };
}
export declare function cloneDesign(url: string): Promise<DesignData>;
