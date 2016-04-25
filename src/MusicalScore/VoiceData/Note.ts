import {VoiceEntry} from "./VoiceEntry";
import {SourceStaffEntry} from "./SourceStaffEntry";
import {Fraction} from "../../Common/DataObjects/fraction";
import {Pitch} from "../../Common/DataObjects/pitch";
import {Beam} from "./Beam";
import {Tuplet} from "./Tuplet";
import {Tie} from "./Tie";
import {Staff} from "./Staff";
import {Slur} from "./Expressions/ContinuousExpressions/Slur";

export class Note {
    constructor(voiceEntry: VoiceEntry, parentStaffEntry: SourceStaffEntry, length: Fraction, pitch: Pitch) {
        this.voiceEntry = voiceEntry;
        this.parentStaffEntry = parentStaffEntry;
        this.length = length;
        this.pitch = pitch;
        if (pitch !== undefined) {
            this.HalfTone = pitch.getHalfTone();
        } else {
          this.HalfTone = 0;
        }
    }
    public HalfTone: number;

    private voiceEntry: VoiceEntry;
    private parentStaffEntry: SourceStaffEntry;
    private length: Fraction;
    private pitch: Pitch;
    private beam: Beam;
    private tuplet: Tuplet;
    private tie: Tie;
    private slurs: Slur[] = [];
    private graceNoteSlash: boolean = false;
    private playbackInstrumentId: string = undefined;
    public get GraceNoteSlash(): boolean {
        return this.graceNoteSlash;
    }
    public set GraceNoteSlash(value: boolean) {
        this.graceNoteSlash = value;
    }
    public get ParentVoiceEntry(): VoiceEntry {
        return this.voiceEntry;
    }
    public set ParentVoiceEntry(value: VoiceEntry) {
        this.voiceEntry = value;
    }
    public get ParentStaffEntry(): SourceStaffEntry {
        return this.parentStaffEntry;
    }
    public get ParentStaff(): Staff {
        return this.parentStaffEntry.ParentStaff;
    }
    public get Length(): Fraction {
        return this.length;
    }
    public set Length(value: Fraction) {
        this.length = value;
    }
    public get Pitch(): Pitch {
        return this.pitch;
    }
    public get NoteBeam(): Beam {
        return this.beam;
    }
    public set NoteBeam(value: Beam) {
        this.beam = value;
    }
    public get NoteTuplet(): Tuplet {
        return this.tuplet;
    }
    public set NoteTuplet(value: Tuplet) {
        this.tuplet = value;
    }
    public get NoteTie(): Tie {
        return this.tie;
    }
    public set NoteTie(value: Tie) {
        this.tie = value;
    }
    public get NoteSlurs(): Slur[] {
        return this.slurs;
    }
    public set NoteSlurs(value: Slur[]) {
        this.slurs = value;
    }
    public get PlaybackInstrumentId(): string {
        return this.playbackInstrumentId;
    }
    public set PlaybackInstrumentId(value: string) {
        this.playbackInstrumentId = value;
    }
    public calculateNoteLengthWithoutTie(): Fraction {
        let withoutTieLength: Fraction = this.length.clone();
        if (this.tie !== undefined) {
            for (let idx: number = 0, len: number = this.tie.Fractions.length; idx < len; ++idx) {
                let fraction: Fraction = this.tie.Fractions[idx];
                withoutTieLength.Sub(fraction);
            }
        }
        return withoutTieLength;
    }
    public calculateNoteOriginalLength(originalLength: Fraction = this.length): Fraction {
        if (this.tie !== undefined) {
            originalLength = this.calculateNoteLengthWithoutTie();
        }
        if (this.tuplet !== undefined) {
            return this.length;
        }
        if (originalLength.Numerator > 1) {
            let exp: number = Math.floor(Math.log(originalLength.Denominator) / Math.LN2) - this.calculateNumberOfNeededDots(originalLength);
            originalLength.Denominator = 1 << exp;
            originalLength.Numerator = 1;
        }
        return originalLength;
    }
    public calculateNoteLengthWithDots(): Fraction {
        if (this.tie !== undefined) {
            return this.calculateNoteLengthWithoutTie();
        }
        return this.length;
    }
    public calculateNumberOfNeededDots(fraction: Fraction = this.length): number {
        // FIXME (Andrea) Test if correct
        if (this.tuplet === undefined) {
            return Math.floor(Math.log(fraction.Numerator) / Math.LN2);
        } else {
            return 0;
        }
    }
    public ToString(): string {
        if (this.pitch !== undefined) {
            return this.Pitch.ToString() + ", length: " + this.Length.ToString();
        } else {
          return "rest note, length: " + this.Length.ToString();
        }
    }
    public getAbsoluteTimestamp(): Fraction {
        return Fraction.plus(
            this.voiceEntry.Timestamp,
            this.parentStaffEntry.VerticalContainerParent.ParentMeasure.AbsoluteTimestamp
        );
    }
    public checkForDoubleSlur(slur: Slur): boolean {
        for (let idx: number = 0, len: number = this.slurs.length; idx < len; ++idx) {
            let noteSlur: Slur = this.slurs[idx];
            if (
              noteSlur.StartNote !== undefined &&
              noteSlur.EndNote !== undefined &&
              slur.StartNote !== undefined &&
              slur.StartNote === noteSlur.StartNote &&
              noteSlur.EndNote === this
            ) { return true; }
        }
        return false;
    }
}

export enum Appearance {
    Normal,
    Grace,
    Cue
}
