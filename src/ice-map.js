import "regenerator-runtime/runtime";

class IceMap {};

class IceBranch extends IceMap {
    constructor(key, val, left = new IceLeaf(), right = new IceLeaf()) {
        super();
        this.key = key;
        this.val = val;
        this.left = left;
        this.right = right;
        this.size = left.size + right.size + 1;
        this.height = Math.max(left.height, right.height) + 1;
        this.tilt = left.height - right.height;
        this.isBalanced = (Math.abs(this.tilt) <= 1)
                        && left.isBalanced
                        && right.isBalanced;
    }

    rotateLeft() {
        // If the right branch is a leaf, a left rotation makes no sense, so we do nothing.
        if (this.right instanceof IceLeaf) { return this; }

        const newLeft = new IceBranch(this.key, this.val, this.left, this.right.left);
        return new IceBranch(
            this.right.key,
            this.right.val,
            newLeft,
            this.right.right
        );
    }

    rotateRight() {
        // If the left branch is a leaf, a right rotation makes no sense, so we do nothing.
        if (this.left instanceof IceLeaf) { return this; }

        const newRight = new IceBranch(this.key, this.val, this.left.right, this.right);
        return new IceBranch(
            this.left.key,
            this.left.val,
            this.left.left,
            newRight
        );
    }

    rotateLeftRight() {
        // If the left branch is a leaf, a left-right rotation makes no sense, so we do nothing.
        if (this.left instanceof IceLeaf) { return this; }

        const newLeft = this.left.rotateLeft();
        return new IceBranch(this.key, this.val, newLeft, this.right).rotateRight();
    }

    rotateRightLeft() {
        // If the right branch is a leaf, a right-left rotation makes no sense, so we do nothing.
        if (this.right instanceof IceLeaf) { return this; }
        
        const newRight = this.right.rotateRight();
        return new IceBranch(this.key, this.val, this.left, newRight).rotateLeft();
    }

    rebalance() {
        // If this branch is already balanced, no need to do anything.
        if (this.isBalanced) { return this; }
        
        // Balance the sub-trees.
        const newLeft  = this.left.rebalance();
        const newRight = this.right.rebalance();

        // If either sub-branch has changed, we'll need a copy of this branch with the new children.
        const newTree = (newLeft !== this.left || newRight !== this.right)
                      ? new IceBranch(this.key, this.val, newLeft, newRight)
                      : this;
        
        // Now that the sub-branches are balanced, we can look at the tilt to see which of our four
        // rotations we need to apply (if any).
        switch (true) {
            case (newTree.tilt > 1 && newTree.left.tilt > 0):
                // The tree tilts to the left, and the left sub-branch tilts left too.
                // This means we need a plain right rotation.
                return newTree.rotateRight().rebalance();
            case (newTree.tilt > 1 && newTree.left.tilt <= 0):
                // The tree tilts to the left, but the left sub-branch tilts to the right. This
                // needs a double rotation.
                return newTree.rotateLeftRight().rebalance();
            case (newTree.tilt < -1 && newTree.right.tilt < 0):
                // The tree tilts to the right, and th right branch leans right too. This means we
                // need a plain left rotation.
                return newTree.rotateLeft().rebalance();
            case (newTree.tilt < -1 && newTree.right.tilt >= 0):
                // The tree tilts to the right, but the right sub-branch tilts left. This needs a
                // double rotation.
                return newTree.rotateRightLeft().rebalance();
            default:
                // Rebalancing the child nodes must have sorted everything out. The tilt of the new
                // tree is no greater than 1.
                return newTree;
        }
    }

    set(key, val) {
        if (key < this.key) {
            return new IceBranch(
                this.key,
                this.val,
                this.left.set(key, val),
                this.right
            ).rebalance();
        }
        if (key > this.key) {
            return new IceBranch(
                this.key,
                this.val,
                this.left,
                this.right.set(key, val)
            ).rebalance();
        }
        // No need to rebalance here. Our tree should be balanced already.
        return new IceBranch(key, val, this.left, this.right);
    }

    get(key) {
        if (key < this.key) { return this.left.get(key); }
        if (key > this.key) { return this.right.get(key); }
        return this.val;
    }

    has(key) {
        if (key < this.key) { return this.left.has(key); }
        if (key > this.key) { return this.right.has(key); }
        return true;
    }
    
    concat(otherTree) {
        switch (true) {
            case (otherTree instanceof IceLeaf): {
                return this;
            }
            case (otherTree.key < this.key): {
                const newLeft = this.left.concat(
                    new IceBranch(
                      otherTree.key,
                      otherTree.val,
                      otherTree.left,
                      new IceLeaf(),
                    )
                  );
                  return new IceBranch(this.key, this.val, newLeft, this.right)
                    .concat(otherTree.right)
                    .rebalance();
            }
            case (otherTree.key > this.key): {
                const newRight = this.right.concat(
                    new IceBranch(
                      otherTree.key,
                      otherTree.val,
                      new IceLeaf,
                      otherTree.right
                    )
                  );
                  return new IceBranch(this.key, this.val, this.left, newRight)
                    .concat(otherTree.left)
                    .rebalance();
            }
            default:
                return new IceBranch(
                    otherTree.key,
                    otherTree.val,
                    this.left.concat(otherTree.left),
                    this.right.concat(otherTree.right)
                ).rebalance();
        }
    }

    delete(key) {
        if (key < this.key) {
            return new IceBranch(
                this.key,
                this.val,
                this.left.delete(key),
                this.right
            ).rebalance();
        }
        if (key > this.key) {
            return new IceBranch(
                this.key,
                this.val, 
                this.left,
                this.right.delete(key)
            ).rebalance();
        }
        return this.left.concat(this.right).rebalance();
    }

    *[Symbol.iterator]() {
        for (let kvPair of this.left) { yield kvPair; }
        yield [this.key, this.val];
        for (let kvPair of this.right) { yield kvPair; }
    }

    entries() { return [...this]; }

    keys()   { return this.entries().map(([k, _]) => k); }
    values() { return this.entries().map(([_, v]) => v); }
    forEach(f) {
        for (let [k, v] of this) {
            f(v, k, this);
        }
    }
}

class IceLeaf extends IceMap {
    constructor () {
        super();
        this.size = 0;
        this.height = 0;
        this.tilt = 0;
        this.isBalanced = true;
    }

    set(key, val) {
        return new IceBranch(key, val);
    }

    rebalance() { return this; }

    get(key) {
        return undefined;
    }

    has(key) { return false; }

    concat(otherTree) {
        return otherTree;
    }

    delete(key) { return this; }

    *[Symbol.iterator]() { return; }

    entries() { return []; }

    keys() { return []; }
    values() { return []; }
}

const handler = {
    construct: function(target, [pairs]) {
        return [...(pairs ?? [])].reduce(
            (node, [k, v]) => node.set(k, v),
            new IceLeaf()
        );
    }
}

export default new Proxy(IceMap, handler);