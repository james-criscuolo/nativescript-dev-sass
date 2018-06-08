import { Component, OnInit } from "@angular/core";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    constructor() {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
    }

    public counter = 42;

    get message() {
        if (this.counter <= 0) {
            return "Hoorraaay! You unlocked the NativeScript clicker achievement!";
        } else {
            return this.counter + " taps left";
        }
    }

    public onTap(args: any) {
        this.counter--;
    }
}
