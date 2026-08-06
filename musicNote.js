const oldTremoloDraw = Vex.Flow.Tremolo.prototype.draw;

Vex.Flow.Tremolo.prototype.draw = function () {

    const note = this.checkAttachedNote();

    const oldGetModifierStartXY = note.getModifierStartXY;

    note.getModifierStartXY = function(position, index) {
        const xy = oldGetModifierStartXY.call(this, position, index);
        return {
            x: xy.x + (this._tremoloXShift || 0),
            y: xy.y + (this._tremoloYShift || 0)
        };
    };

    note._tremoloXShift = this.x_shift || 0;
    note._tremoloYShift = this.y_shift || 0;

    oldTremoloDraw.call(this);

    note.getModifierStartXY = oldGetModifierStartXY;
};

const originalArticulationDraw = Vex.Flow.Articulation.prototype.draw;

Vex.Flow.Articulation.prototype.draw = function () {

    const context = this.checkContext();
    const note = this.checkAttachedNote();

    this.setRendered();

    const index = this.checkIndex();
    const { position, glyph, text_line } = this;
    const betweenLines = this.articulation.between_lines;

    const stave = note.checkStave();
    const spacing = stave.getSpacingBetweenLines();

    const isTabNote = note.getCategory && note.getCategory() === "TabNote";
    const avoidStaffEdge = !betweenLines || isTabNote;

    const { x } = note.getModifierStartXY(position, index);

    const margin = (() => {
        const stemMatches =
            (position === Vex.Flow.Modifier.Position.ABOVE &&
                note.getStemDirection() === Vex.Flow.Stem.UP) ||
            (position === Vex.Flow.Modifier.Position.BELOW &&
                note.getStemDirection() === Vex.Flow.Stem.DOWN);

        if (note.getCategory && note.getCategory() === "StaveNote") {
            return note.hasStem() && stemMatches ? 0.5 : 1;
        }

        return note.hasStem && note.hasStem() && stemMatches ? 1 : 0;
    })();

    let y;

    if (position === Vex.Flow.Modifier.Position.ABOVE) {

        glyph.setOrigin(0.5, 1);

        const stem = note.getStemExtents();

        y = (note.hasStem() && note.getStemDirection() === Vex.Flow.Stem.UP)
            ? stem.topY
            : Math.min(...note.getYs());

        y -= (text_line + margin) * spacing;

    } else {

        glyph.setOrigin(0.5, 0);

        const stem = note.getStemExtents();

        y = (note.hasStem() && note.getStemDirection() === Vex.Flow.Stem.UP)
            ? stem.baseY
            : Math.max(...note.getYs());

        y += (text_line + margin) * spacing;
    }

    // <-- YOUR NEW BIT
    glyph.render(
        context,
        x + (this.x_shift || 0),
        y + (this.y_shift || 0)
    );
};

class MusicNote extends HTMLElement {
    connectedCallback() {

        this.innerHTML = "";

        const pitch = this.getAttribute("pitch") || "c/4";
        let duration = this.getAttribute("duration") || "4";
        const articulation = this.getAttribute("articulation");
        const tuplet = this.getAttribute("tuplet");

        if (articulation === "acc") {
            duration = "8";
        }

        const renderer = new Vex.Flow.Renderer(
            this,
            Vex.Flow.Renderer.Backends.SVG
        );

        renderer.resize(43, 37);

        const context = renderer.getContext();
        context.scale(0.35, 0.35);

        const stave = new Vex.Flow.Stave(3, 0, 115);
        stave.addClef("treble");
        stave.setContext(context).draw();

        let notes;

        // Acciaccatura
        if (articulation === "acc") {

            notes = [
                new Vex.Flow.GraceNote({
                    keys: [pitch],
                    duration: duration,
                    slash: true
                })
            ];

        } else if (tuplet === "3") {

            notes = [
                new Vex.Flow.StaveNote({
                    keys: [pitch],
                    duration: duration
                }),
                new Vex.Flow.StaveNote({
                    keys: ["a/4"],
                    duration: duration + "r"
                }),
                new Vex.Flow.StaveNote({
                    keys: ["a/4"],
                    duration: duration + "r"
                })
            ];

        } else {

            notes = [
                new Vex.Flow.StaveNote({
                    keys: [pitch],
                    duration: duration
                })
            ];

        }

        const accidental = pitch.match(/[#b]/);

        if (accidental) {
            notes[0].addModifier(
                new Vex.Flow.Accidental(accidental[0])
            );
        }
        if (articulation !== "acc") {
            notes[0].setStemStyle({
                strokeStyle: "transparent"
            });
        }


        // Normal articulations
        if (articulation !== "acc") {

            let artic;
            let artic2;

            switch (articulation) {

                case "ord":
                    break;

                case "stacc":
                    artic = new Vex.Flow.Articulation("a.").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    notes[0].addModifier(artic);
                    break;

                case "ten":
                    artic = new Vex.Flow.Articulation("a-").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    notes[0].addModifier(artic);
                    break;

                case "accent":
                    artic = new Vex.Flow.Articulation("a>").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    notes[0].addModifier(artic);
                    break;

                case "marc":
                    artic = new Vex.Flow.Articulation("a^").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    notes[0].addModifier(artic);
                    break;

                case "loure":
                    artic = new Vex.Flow.Articulation("a.").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    artic2 = new Vex.Flow.Articulation("a-").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic2.x_shift = -5;
                    artic2.y_shift = 30;
                    notes[0].addModifier(artic).addModifier(artic2);
                    break;

                case "wedge":
                    artic = new Vex.Flow.Articulation("av").setPosition(Vex.Flow.Modifier.Position.ABOVE);
                    artic.x_shift = -5;
                    artic.y_shift = 30;
                    notes[0].addModifier(artic);
                    break;

                case "harm":
                    break;

                case "slur":
                    break;

                case "gliss":
                    break;

                case "trem":
                    const trem = new Vex.Flow.Tremolo(3);
                    trem.x_shift = -10;
                    trem.y_shift = 16;
                    notes[0].addModifier(trem);
            }
        }

        notes[0].setXShift(-5);


        let voice;

        if (tuplet === "3") {

            voice = new Vex.Flow.Voice({
                num_beats: 3,
                beat_value: parseInt(duration)
            });

        } else {

            voice = new Vex.Flow.Voice({
                num_beats: 1,
                beat_value: parseInt(duration)
            });

        }


        voice.addTickables(notes);


        let triplet;

        if (tuplet === "3") {
            triplet = new Vex.Flow.Tuplet(notes);
        }


        new Vex.Flow.Formatter()
            .joinVoices([voice])
            .format([voice], 60);


        voice.draw(context, stave);


        if (triplet) {
            triplet.setContext(context);
            triplet.draw();
        }

        if (articulation === "harm") {
            const x = notes[0].getAbsoluteX();
            const y = notes[0].getYs()[0];

            context.setFont("Arial", "30px", "");

            context.fillText(
                "°",
                x - 5,
                y + 3
            );
        } else if (articulation === "gliss") {
            const x = notes[0].getAbsoluteX();
            const y = notes[0].getYs()[0];

            context.setFont("Leland", "18px", "");

            context.fillText(
                "gliss.",
                x + 12,
                y + 4
            );
        } else if (articulation === "slur") {
            const x = notes[0].getAbsoluteX();
            const y = notes[0].getYs()[0];

            const group = context.openGroup();

            group.setAttribute(
                "transform",
                `rotate(10 ${x + 4} ${y - 10})`
            );

            context.setFont("Leland", "60px", "");

            context.fillText(
                "\uE4BA",
                x + 4,
                y - 10
            );
        } else if (articulation === "acc") {
            const x = notes[0].getAbsoluteX();
            const y = notes[0].getYs()[0];

            const group = context.openGroup();

            group.setAttribute(
                "transform",
                `rotate(15 ${x + 4} ${y - 10})`
            );

            context.setFont("Leland", "35px", "");

            context.fillText(
                "\uE4BA",
                x + 3,
                y - 25
            );
        }

    }
}


customElements.define(
    "music-note",
    MusicNote
);