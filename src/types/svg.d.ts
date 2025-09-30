import {SVGProps, RefAttributes} from 'react';

declare module '@heroicons/react/24/outline' {
    export interface IconProps extends SVGProps<SVGSVGElement> {
        title?: string;
        titleId?: string;
        className?: string;
    }

    export const EllipsisVerticalIcon: React.FC<IconProps>;
    export const EyeIcon: React.FC<IconProps>;
    export const PencilSquareIcon: React.FC<IconProps>;
    export const TrashIcon: React.FC<IconProps>;
    export const LinkIcon: React.FC<IconProps>;
    export const PlusIcon: React.FC<IconProps>;
    export const MagnifyingGlassIcon: React.FC<IconProps>;
    export const FunnelIcon: React.FC<IconProps>;
    export const ArrowsUpDownIcon: React.FC<IconProps>;
    export const Squares2X2Icon: React.FC<IconProps>;
    export const BookmarkIcon: React.FC<IconProps>;
    export const ShieldCheckIcon: React.FC<IconProps>;
    export const InformationCircleIcon: React.FC<IconProps>;
    export const XMarkIcon: React.FC<IconProps>;
}
