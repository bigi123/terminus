import { Component, Input, HostBinding, HostListener, NgZone, ViewChild, ElementRef } from '@angular/core'
import { SortableComponent } from 'ng2-dnd'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { BaseTabComponent } from './baseTab.component'
import { RenameTabModalComponent } from './renameTabModal.component'
import { ElectronService } from '../services/electron.service'
import { AppService } from '../services/app.service'
import { HostAppService, Platform } from '../services/hostApp.service'

@Component({
    selector: 'tab-header',
    template: require('./tabHeader.component.pug'),
    styles: [require('./tabHeader.component.scss')],
})
export class TabHeaderComponent {
    @Input() index: number
    @Input() @HostBinding('class.active') active: boolean
    @Input() @HostBinding('class.has-activity') hasActivity: boolean
    @Input() tab: BaseTabComponent
    @Input() progress: number
    @ViewChild('handle') handle: ElementRef

    private contextMenu: any

    constructor (
        zone: NgZone,
        electron: ElectronService,
        public app: AppService,
        private hostApp: HostAppService,
        private ngbModal: NgbModal,
        private parentDraggable: SortableComponent,
    ) {
        this.contextMenu = electron.remote.Menu.buildFromTemplate([
            {
                label: 'Close',
                click: () => {
                    zone.run(() => {
                        app.closeTab(this.tab, true)
                    })
                }
            },
            {
                label: 'Close other tabs',
                click: () => {
                    zone.run(() => {
                        for (let tab of app.tabs.filter(x => x !== this.tab)) {
                            app.closeTab(tab, true)
                        }
                    })
                }
            },
            {
                label: 'Close tabs to the right',
                click: () => {
                    zone.run(() => {
                        for (let tab of app.tabs.slice(app.tabs.indexOf(this.tab) + 1)) {
                            app.closeTab(tab, true)
                        }
                    })
                }
            },
            {
                label: 'Close tabs to the left',
                click: () => {
                    zone.run(() => {
                        for (let tab of app.tabs.slice(0, app.tabs.indexOf(this.tab))) {
                            app.closeTab(tab, true)
                        }
                    })
                }
            },
        ])
    }

    ngOnInit () {
        if (this.hostApp.platform === Platform.macOS) {
            this.parentDraggable.setDragHandle(this.handle.nativeElement)
        }
        this.tab.progress$.subscribe(progress => {
            this.progress = progress
        })
    }

    @HostListener('dblclick') onDoubleClick (): void {
        let modal = this.ngbModal.open(RenameTabModalComponent)
        modal.componentInstance.value = this.tab.customTitle || this.tab.title
        modal.result.then(result => {
            this.tab.setTitle(result)
            this.tab.customTitle = result
        }).catch(() => null)
    }

    @HostListener('auxclick', ['$event']) onAuxClick ($event: MouseEvent): void {
        if ($event.which === 2) {
            this.app.closeTab(this.tab, true)
        }
        if ($event.which === 3) {
            this.contextMenu.popup({
                x: $event.pageX,
                y: $event.pageY,
                async: true,
            })
            event.preventDefault()
        }
    }
}
