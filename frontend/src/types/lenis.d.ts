declare module '@studio-freight/react-lenis' {
    import * as React from 'react';

    export interface ReactLenisProps {
        children: React.ReactNode;
        root?: boolean;
        options?: any;
        className?: string;
    }

    export const ReactLenis: React.FC<ReactLenisProps>;
}
