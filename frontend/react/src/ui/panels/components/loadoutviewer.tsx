import React from "react";

export function LoadoutViewer(props: { spawnLoadout: { items: { name: string; quantity: number }[] } }) {
    return (
        <div>
            {props.spawnLoadout.items.map((item) => {
                return (
                    <div
                        className={`flex content-center gap-2`}
                        key={item.name}
                    >
                        <div
                            className={`
                              my-auto w-6 min-w-6 rounded-full py-0.5
                              text-center text-sm font-bold text-gray-500
                              dark:bg-[#17212D]
                            `}
                        >
                            {item.quantity}x
                        </div>
                        <div
                            className={`
                              my-auto overflow-hidden text-ellipsis text-nowrap
                              text-sm
                              dark:text-gray-300
                            `}
                        >
                            {item.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
