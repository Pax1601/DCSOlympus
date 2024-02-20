import { Unit } from "./unit";

export class Group {
    #members: Unit[] = [];
    #name: string;

    constructor(name: string) {
        this.#name = name;

        document.addEventListener("unitDeath", (e: any) => {
            if (this.#members.includes(e.detail))
                this.getLeader()?.onGroupChanged(e.detail);
        });
    }

    getName() {
        return this.#name;
    }

    addMember(member: Unit) {
        if (!this.#members.includes(member)) {
            this.#members.push(member);
            member.setGroup(this);

            this.getLeader()?.onGroupChanged(member);
        }
    }

    removeMember(member: Unit) {
        if (this.#members.includes(member)) {
            delete this.#members[this.#members.indexOf(member)];
            member.setGroup(null);

            this.getLeader()?.onGroupChanged(member);
        }
    }

    getMembers() {
        return this.#members;
    }

    getLeader() {
        return this.#members.find((unit: Unit) => { return (unit.getIsLeader() && unit.getAlive())})
    }
}