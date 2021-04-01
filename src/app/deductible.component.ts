import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
 import { RestService } from 'app/shared/_services/rest-service';
import { ConstantUtil } from 'app/shared/constant-util';
import { CommonUtil } from 'app/shared/common-util';
import { LookupDialogComponent } from '../common/lookup-dialog.component';
import { ConfirmDialogModel } from '../common/confirm-dialog-model';
import { ConfirmationDialogComponent } from '../common/confirmation-dialog.component';
import { CommonDetailsDialog } from '../common/common-details-dialog.component';
import { UserService } from 'app/shared/_services/user.service';
import { WfEngineService } from 'app/shared/_services/wf-engine.service';
import { effectiveDatePickerValidator } from '../common/custom-validator';

@Component({
  selector: 'app-deductible',
  templateUrl: './deductible.component.html',
  styleUrls: ['./deductible.component.css']
})
export class DeductibleComponent implements OnInit {
  searchRequest: any;
  searchEnabled: boolean;
  selectedBTId: string;
  action: string;
  submitAction: boolean;
  currentUser : string;
  allDeductibles: any[];
  allDeductibleBusinessTerms: any[];
  confirmMessage = '';
  @Input() min: any;
  today = new Date();
  effDtErrMsg = ConstantUtil.EFFECTIVE_DATE_ERR_MSG;

  constructor(private fb: FormBuilder,
    public dialog: MatDialog, public confirmDialog: MatDialog,
    public commonDetailsDialog: MatDialog,
    private restService: RestService,
    private userService: UserService,
    private wfService: WfEngineService) {
      this.today.setDate(this.today.getDate());
      this.currentUser = this.userService.getCurrentUser();
    }

  deductibleForm = this.fb.group({
    deductible_id: '',
    short_name: ['', Validators.required],
    description: ['', Validators.required],
    short_code: '',
    display_label: '',
    business_term_id: '',
    optionality: ['', Validators.required],
    type: ['', Validators.required],
    category: '',
    lob: ['', Validators.required],
    deleted_ind: 0,
    effective_dt: [new Date(), Validators.required],
    created_by: '',
    created_ts: new Date(),
    updated_by: '',
    updated_ts: new Date()
  });

  deductibleOptionality = ['Optional', 'Mandatory'];
  deductibleType = ['Flat', 'Percentage', 'WaitingPeriod'];
  lobOptions: string[];

  ngOnInit() {
    this.searchEnabled = true;
    this.searchRequest = {action: ConstantUtil.SEARCH, type: ConstantUtil.BT_TYPE_DEDUCTIBLE};
    this.getLobs();
    this.getDeductibles();
    this.getBusinessTerms();
  }

  receiveMessage($event: any) {
    this.processAction($event.action, $event.data);
  }

  getLobs() {
    this.wfService.getLobs$().subscribe((res) => {
        this.lobOptions = res;
    });
  }
  getDeductibles() {
    this.restService.getDeductibles()
      .subscribe(
        (response) => {
          console.log('response' , response);
          this.allDeductibles = response;
        },
        (error) => {
          this.confirmationDetails(ConstantUtil.FAILURE, 'Error: Failed to retrieve the Deductibles, please try later');
          console.error(error);
        }
      );
    console.log(this.allDeductibles);
    return this.allDeductibles;
  }

  getBusinessTerms() {
    this.restService.getBusinessTerms()
      .subscribe(
        (response) => {
          console.log('getBusinessTerms - response: ' , response);
          if (null != response && response.length > 0) {
            this.allDeductibleBusinessTerms = response.filter(x => x.type === ConstantUtil.BT_TYPE_DEDUCTIBLE);
          }
          console.log('allDeductibleBusinessTerms - response: ', this.allDeductibleBusinessTerms);
        },
        (error) => {
          this.confirmationDetails(ConstantUtil.FAILURE, 'Error: Failed to retrieve the Business Terms, please try later');
          console.error(error);
        }
      );
  }

  setDeductibleForm(action: string, id: string) {
    console.log('setDeductibleForm : ', action, id);
    let item: any;
    if ( ConstantUtil.CREATE_ACTION === action) {
      if (null != this.allDeductibleBusinessTerms && this.allDeductibleBusinessTerms.length > 0) {
        item = this.allDeductibleBusinessTerms.filter(x => x.term_id === id)[0];
        this.deductibleForm = this.fb.group({
          deductible_id: '',
          short_name: item.short_name,
          description: item.long_description,
          short_code: item.short_code,
          display_label: item.display_label,
          business_term_id: item.term_id,
          optionality: item.optionality,
          type: '',
          category: item.category,
          lob: item.lob,
          deleted_ind: 0,
          effective_dt: [new Date(), [Validators.required, effectiveDatePickerValidator()]],
          created_by: this.currentUser,
          created_ts: new Date(),
          updated_by: this.currentUser,
          updated_ts: new Date()
        });
      }
    } else {
      // View or Clone or Update form
      if (null != this.allDeductibles && this.allDeductibles.length > 0) {
        item = this.allDeductibles.filter(x => x.deductible_id === id)[0];
        this.deductibleForm = this.fb.group({
        deductible_id: (this.action === ConstantUtil.CLONE_ACTION ? '' : item.deductible_id),
        short_name: item.short_name,
        description: item.description,
        short_code: item.short_code,
        display_label: item.display_label,
        business_term_id: item.business_term_id,
        optionality: item.optionality,
        type: item.type,
        category: item.category,
        lob: item.lob,
        deleted_ind: 0,
        effective_dt: [item.effective_dt, [Validators.required, effectiveDatePickerValidator()]],
        created_by: (ConstantUtil.CLONE_ACTION === action ? this.currentUser : item.created_by),
        created_ts: (ConstantUtil.CLONE_ACTION === action ? new Date() : item.created_ts),
        updated_by: this.currentUser,
        updated_ts: new Date()
        });
      }
    }
    console.log('item--> ', item);
    this.selectedBTId = id;
  }

  onSaveUpdate(action, deductibleId) {
    console.log(action, deductibleId);
    if (action === ConstantUtil.CREATE_ACTION || action === ConstantUtil.CLONE_ACTION) {
      this.restService.postDeductible(this.deductibleForm.value)
      .subscribe(
        (response) => {
          console.log('Deductible Id' , response.insertId);
          if (null != response && null != response.insertId) {
            this.getDeductibles();
            this.confirmationDetails(ConstantUtil.SUCCESS, 'Deductible created successfully');
          }
        },
        (error) => {
          console.error(error);
          if (null != error) {
            this.confirmationDetails(ConstantUtil.FAILURE, 'Error: Failed to create the Deductible, please try later');
          }
        }
      );
    } else if (action === ConstantUtil.UPDATE_ACTION) {
      this.restService.putDeductible(this.deductibleForm.value)
      .subscribe(
        (response) => {
          console.log('Affected Rows' , response.changedRows);
          if ( null != response && null != response.changedRows) {
            this.getDeductibles();
            this.confirmationDetails(ConstantUtil.SUCCESS, 'Updated the Deductible successfully');
          }
        },
        (error) => {
          console.error(error);
          if (null != error) {
            this.confirmationDetails(ConstantUtil.FAILURE, 'Error: Failed to update the Deductible, please try later');
          }
        }
      );
    }
  }

  onCancel() {
    this.deductibleForm.reset();
    this.selectedBTId = null;
    this.searchEnabled = true;
  }

  createDeductible() {
    this.confirmMessage = '';
    if (null != this.allDeductibleBusinessTerms) {
      const dataItems = this.allDeductibleBusinessTerms.filter(x => x.type === ConstantUtil.BT_TYPE_DEDUCTIBLE);
      const dialogRef = this.dialog.open(LookupDialogComponent, {
        width: '570px',
        disableClose: true,
        data: {title: 'Choose Business Term', option: ConstantUtil.BUSINESS_TERM, message: dataItems}
      });
      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed----------->' + result);
        if (null != result) {
          this.setDeductibleForm(ConstantUtil.CREATE_ACTION, result);
          this.submitAction = true;
          this.searchEnabled = false;
          this.action = ConstantUtil.CREATE_ACTION;
        }
      });
    } else {
      this.confirmationDetails(ConstantUtil.FAILURE, 'Failed to retrive the Deductibles - Business Terms, please try after sometime');
    }
  }

  searchDeductibles() {
    this.selectedBTId = null;
    this.getDeductibles();
    if (null != this.allDeductibles) {
      this.searchEnabled = true;
    } else {
      this.searchEnabled = false;
      this.confirmationDetails(ConstantUtil.FAILURE, 'Error: Failed to display the Deductibles, please try later');
    }
  }

  processAction(action: string, data: any) {
    this.searchEnabled = false;
    if (null != data) {
      console.log(data, action);
      if (action === ConstantUtil.VIEW_ACTION) {
        this.submitAction = false;
        this.action = ConstantUtil.VIEW_ACTION;
      } else if (action === ConstantUtil.CLONE_ACTION) {
        this.submitAction = true;
        this.action = ConstantUtil.CLONE_ACTION;
      } else {
        this.submitAction = true;
        this.action = ConstantUtil.UPDATE_ACTION;
      }
      this.setDeductibleForm('search', data.deductible_id);
    }
  }

  confirmationDialog(action: string, deductibleId: string) {
    const message = 'Are you sure to ' + action.toLowerCase() + ' the deductible !!!';
    const dialogData = new ConfirmDialogModel(ConstantUtil.BT_TYPE_DEDUCTIBLE, message);
    const cofirmDialogRef = this.confirmDialog.open(ConfirmationDialogComponent, {
      width: '520px',
      disableClose: true,
      data: dialogData
    });

    cofirmDialogRef.afterClosed().subscribe(dialogResult => {
      console.log('The confirmation dialog was closed----------->' + dialogResult);
      if (dialogResult) {
        this.onSaveUpdate(action, deductibleId);
      }
    });
  }

  confirmationDetails(title, message) {
    const commonDetailsDialogRef = this.commonDetailsDialog.open(CommonDetailsDialog, {
      width: 'auto',
      disableClose: true,
      data: {title, message}
    });

    commonDetailsDialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed ', result);
      if (result && title === ConstantUtil.FAILURE) {
        this.submitAction = true;
        this.searchEnabled = false;
      } else if (result && title === ConstantUtil.SUCCESS) {
        this.submitAction = false;
        this.searchEnabled = true;
        this.selectedBTId = null;
      }
    });
  }
}
