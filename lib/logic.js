/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * A Member grants access to their record to another Member.
 * @param {org.healthcare.records.AuthorizeAccess} authorize - the authorize to be processed
 * @transaction
 */
function authorizeAccess(authorize) {

    var me = getCurrentParticipant();
    console.log('**** AUTH: ' + me.getIdentifier() + ' granting access to ' + authorize.user.getIdentifier() );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is not already authorized, we authorize them
    var index = -1;

    if(!me.authorized) {
        me.authorized = [];
    }
    else {
        index = me.authorized.indexOf(authorize.user.getIdentifier());
    }

    if(index < 0) {
        me.authorized.push(authorize.user.email);

        return getParticipantRegistry('org.healthcare.records.Member')
        .then(function (memberRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.healthcare.records', 'MemberEvent');
            event.memberTransaction = authorize;
            emit(event);

            // persist the state of the member
            return memberRegistry.update(me);
        });
    }
}

/**
 * A Member revokes access to their record from another Member.
 * @param {org.healthcare.records.RevokeAccess} revoke - the RevokeAccess to be processed
 * @transaction
 */
function revokeAccess(revoke) {

    var me = getCurrentParticipant();
    console.log('**** REVOKE: ' + me.getIdentifier() + ' revoking access to ' + revoke.user.getIdentifier() );

    if(!me) {
        throw new Error('A participant/certificate mapping does not exist.');
    }

    // if the member is authorized, we remove them
    var index = me.authorized ? me.authorized.indexOf(revoke.user.email) : -1;

    if(index>-1) {
        me.authorized.splice(index, 1);

        return getParticipantRegistry('org.healthcare.records.User')
        .then(function (userRegistry) {

            // emit an event
            var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
            event.userTransaction = revoke;
            emit(event);

            // persist the state of the member
            return userRegistry.update(me);
        });
    }
}


function addReport(add){

	var patient = data.user;
    me = getCurrentParticipant();

    var report = new Report();
    report.text = add.text;
    report.title = add.title;
    report.timestamp = Date.now();
    report.authorId = me.getIdentifier();

	if(!patient) {
        throw new Error('A patient does not exist.');
    }

	patient.reports.push(report);

	return getParticipantRegistry('org.healthcare.records.User')
	.then(function (userRegistry) {

		var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
		event.userTransaction = add;
		emit(event);

		return userRegistry.update(data.user);
	});
}

/* TODO Verify that authorId is the same 
function removeReport(remove){

	var patient = remove.user.getIdentifier();

	if(!patient) {
        throw new Error('A patient does not exist.');
    }

	delete patient.data[data.title];

	return getParticipantRegistry('org.healthcare.records.User')
	.then(function (userRegistry) {

		var event = getFactory().newEvent('org.healthcare.records', 'MemberEvent');
		event.memberTransaction = removeData;
		emit(event);

		return memberRegistry.update(data.patient);
	});
}
*/

function updateHealthData(update){
	var patient = update.user;

	if(!patient) {
        throw new Error('A patient does not exist.');
    }

    patient.healthData = update.healthData;

	return getParticipantRegistry('org.healthcare.records.User')
	.then(function (userRegistry) {

		var event = getFactory().newEvent('org.healthcare.records', 'UserEvent');
		event.memberTransaction = updateSummary;
		emit(event);

		return userRegistry.update(update.user);
	});
}
