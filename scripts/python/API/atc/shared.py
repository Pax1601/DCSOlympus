GLOBAL_ORDER = 0

def get_new_order() -> int:
    """
    Get a new global order number.
    This is used to assign sequential orders to units for taxiing and takeoff sequencing.
    
    Returns:
        int: A new unique order number.
    """
    global GLOBAL_ORDER
    GLOBAL_ORDER += 1
    return GLOBAL_ORDER