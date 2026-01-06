import { useState, useRef, type KeyboardEventHandler, type ReactNode, type WheelEventHandler, useEffect, Activity } from 'react';
import SmallArrow from '@/assets/icons/smallArrow.svg?react';

interface DropdownProps<T extends ReactNode> {
    items: T[],
    selectItem: (value: T) => void,
    wheelHandler?: WheelEventHandler,
    keyDownHandler?: KeyboardEventHandler
    activeItem?: T,
    itemClass?: string,
    selectedItemClass?: string,
    activeItemClass?: string,
    className?: string,
    theme?: string,
    withIcon?: boolean
}

const THEMES: { [key: string]: string } = {
    'primary': 'dropdown--primary',
    'secondary': 'dropdown--secondary',
    'semiDark': 'dropdown--semi-dark'
}

export const Dropdown = <T extends ReactNode>({ 
    items, 
    selectItem, 
    activeItem, 
    wheelHandler, 
    keyDownHandler, 
    itemClass, 
    selectedItemClass, 
    activeItemClass, 
    className,
    theme = '', 
    withIcon }: DropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const stateMenuHandler = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        const controller = new AbortController();

        document.addEventListener('mousedown', stateMenuHandler, { signal: controller.signal});
        
        if (itemsRef.current) {
            const itemsPos = itemsRef.current.getBoundingClientRect();
            const itemPos = itemsRef.current.children[0].getBoundingClientRect();
            const itemsHeight = itemsRef.current.children.length * itemPos?.height;
            const resHeight = itemsPos.top + itemsHeight;
            if (resHeight > window.innerHeight) {
                itemsRef.current?.classList.add('dropdown__items--top');
            }
        }

        return () => {
            controller.abort();
        }
    })

    return <div className={`dropdown ${className} ${withIcon ?? 'dropdown--with-icon'} ${THEMES[theme]}`} ref={menuRef} onClick={() => setIsOpen(!isOpen)}>
        <div className={"dropdown__selected" + ` ${selectedItemClass}`}>{activeItem}</div>
        <div ref={itemsRef} className={isOpen ? `dropdown__items open` : "dropdown__items"} onWheel={wheelHandler} onKeyDown={keyDownHandler}>
            {items.map((item) => {
                return <button key={String(item)} onClick={() => {
                    selectItem(item);
                }} 
                className={item === activeItem 
                ? "dropdown__item dropdown__item--active" + ` ${itemClass} ${activeItemClass}` 
                : "dropdown__item" + ` ${itemClass}`}>
                    {item}
                </button>
            })}
        </div>
        <Activity mode={withIcon ? 'visible' : 'hidden'}>
            <div className="dropdown__icon">
                <SmallArrow />
            </div>
        </Activity>
    </div>
}